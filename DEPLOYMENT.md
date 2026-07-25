# Production Deployment — AWS Lightsail + S3 + CloudFront

This covers deploying InstaChat's backend API on **Lightsail**, media storage/delivery on **S3 + CloudFront**, and the async image/video processing pipeline on **Lambda**.

## Architecture

```
Mobile app (Expo)  ─┐
Admin panel (Vite) ─┼─► https://api.yourdomain.com  (Nginx → Node/Express on Lightsail)
                     │        │
                     │        ├─► MongoDB Atlas (recommended over self-hosting)
                     │        └─► Redis (self-hosted on the same Lightsail instance)
                     │
                     └─► https://cdn.yourdomain.com  (CloudFront → S3 bucket)
                              ▲
                              └── S3 ObjectCreated event → Lambda (sharp / ffmpeg)
                                  writes thumbnail/medium variants back to the same bucket
```

Two separate domains matter here and the app breaks in confusing ways if they're mixed up:
- **API domain** (`api.yourdomain.com`) — the Express server. Used by `frontend/instachat/src/services/api.js` (`API_URL`) and `socket.js` (`SOCKET_URL`), and by `admin-panel/vite.config.ts`'s proxy in dev.
- **CDN domain** (`cdn.yourdomain.com`) — CloudFront in front of S3. Used by the backend's `CDN_BASE_URL` env var to build the public URLs stored on posts/reels/stories.

If `API_URL` ever points at a domain that doesn't resolve (this exact bug happened during local dev — see git history), every request fails silently from the app's perspective with generic network errors. Always curl the health endpoint after any URL change: `curl https://api.yourdomain.com/api/v1/health`.

---

## 1. S3 bucket

1. Create a bucket, e.g. `instachat-media-prod`. Keep **Block Public Access** ON — CloudFront will read via Origin Access Control (OAC), not public bucket policy, so objects stay private at the S3 layer.
2. Bucket CORS (needed because the app uploads directly from the client via presigned URLs — see `media.service.js` / `reel.controller.js`'s `getPresignedUrl`):
   ```json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["PUT", "GET"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```
3. Bucket layout the app already assumes (don't rename these prefixes without updating the corresponding controllers):
   ```
   users/<userId>/posts/images/<timestamp>-<hash>.<ext>       # original upload
   users/<userId>/posts/images/thumbnail/...                  # Lambda output
   users/<userId>/posts/images/medium/...                     # Lambda output
   users/<userId>/posts/videos/<timestamp>-<hash>.<ext>
   users/<userId>/reels/<timestamp>-<randomId>.<ext>
   ```
   Stories currently upload into the same `posts/images|videos` prefixes via `upload.middleware.js` (multer-s3) — that's existing behavior, not something this doc changes.
4. Note two upload paths coexist in this codebase: **presigned PUT from the client** (posts, reels, media-service) and **server-side multer-s3** (stories, `upload.middleware.js`). Both need the bucket name and IAM credentials below.

### IAM

Create an IAM user (or better, an instance role attached to the Lightsail instance if you use Lightsail's "Attach instance role" containers feature — plain Lightsail VMs don't support IAM roles directly, so a scoped IAM user + access keys is the practical option here) with a policy limited to this bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::instachat-media-prod/*"
    }
  ]
}
```

---

## 2. CloudFront

1. Create a distribution with the S3 bucket as origin, using **Origin Access Control (OAC)** (not the legacy OAI) — CloudFront console will offer to update the bucket policy for you automatically.
2. Cache behavior: `GET, HEAD` only, cache based on the query string off (the app appends cache-busting via unique filenames, not query params — see the `CacheControl` headers already set in `media.service.js`: `immutable` for images, 1-day for video).
3. Attach a custom domain (`cdn.yourdomain.com`) with an ACM certificate issued in **us-east-1** (required for CloudFront regardless of which region your bucket/Lightsail instance is in).
4. Set `CDN_BASE_URL=https://cdn.yourdomain.com` in the backend `.env` — this is what `reelController.createReel` and friends prepend to S3 keys (`videoUrl = ${CDN_BASE_URL}/${videoKey}`) to build the URLs stored in Mongo and returned to clients.

---

## 3. Lambda: image/video processing pipeline

`backend/lambdas/imageProcessor.js` and `videoProcessor.js` are S3-event-triggered functions, not deployed as part of the Express app. Deploy them separately per function:

### imageProcessor (sharp)
- `sharp` ships native binaries — building it on your local machine (especially Apple Silicon or Windows) and zipping it up will **not** run on Lambda's Amazon Linux runtime. Either:
  - build in a matching container: `docker run --rm -v "$PWD":/var/task public.ecr.aws/sam/build-nodejs20.x npm install --arch=x64 --platform=linux --libc=glibc sharp`, or
  - use a prebuilt Lambda Layer for `sharp` (several public ones exist), or
  - package as a **container image** Lambda instead of a zip (simplest to get right).
- Runtime: Node.js 20.x, memory ≥512MB (image resizing is CPU-bound — more memory also means more vCPU on Lambda), timeout ~30s.

### videoProcessor (fluent-ffmpeg)
- Needs an `ffmpeg` binary on `PATH` — Lambda doesn't include one. Attach a public `ffmpeg` Lambda Layer (e.g. the widely-used `ffmpeg-lambda-layer`), or again use a container image with ffmpeg installed.
- Memory ≥1536MB, timeout close to the max relevant for your video length cap (reels are capped at 100MB client-side — see `reel.controller.js`'s `MAX_REEL_MB`); if transcodes regularly approach the 15-minute Lambda ceiling, move this to a different compute model (Fargate/Batch) instead of forcing it into Lambda.

### S3 trigger
- Trigger: `s3:ObjectCreated:*` on the bucket, no prefix/suffix filter needed — both handlers self-filter by checking the key path (they skip anything already under a `thumbnail/`/`medium/` segment) so they don't reprocess their own output. Don't add a suffix filter like `.jpg` that would also match the Lambda's own `.webp` output on a future revision — check the handler logic before changing this.
- IAM role for both functions: read/write on the same bucket only, plus `logs:CreateLogGroup/CreateLogStream/PutLogEvents`.

---

## 4. Lightsail instance (Node backend)

### 4.1 Create the instance

Lightsail console → Create instance → **Linux/Unix → OS Only → Ubuntu 22.04 LTS** (plain Ubuntu, not the Node.js blueprint — the blueprint's bundled Node version is out of your control and typically stale; installing via NodeSource below is more predictable). Pick a plan with at least 2GB RAM — Node + Redis + Nginx together are tight on the 1GB tier.

Networking tab → firewall rules: allow inbound `22` (SSH), `80` (HTTP), `443` (HTTPS) only. Do **not** open `5000` (or whatever `PORT` you use) or `6379` (Redis) — both stay internal, reached only via Nginx/localhost.

Attach a static IP (Lightsail → Networking → Create static IP) so it survives instance stop/start, and point `api.yourdomain.com`'s DNS A record at it.

### 4.2 One-time server setup

SSH in (`ssh ubuntu@<static-ip>`) and run this end-to-end — system packages, Node 20 LTS, Redis, Nginx, Certbot, PM2:

```bash
# System update
sudo apt update && sudo apt upgrade -y

# Node.js 20 LTS via NodeSource (apt-based, not nvm — plays cleanly with
# systemd/pm2 startup, which nvm's per-user PATH setup often fights with)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git build-essential

node -v   # sanity check: v20.x
npm -v

# Redis (self-hosted on this same instance, matches redis.js's
# 127.0.0.1 default in its PRODUCTION block)
sudo apt install -y redis-server
sudo sed -i 's/^supervised no/supervised systemd/' /etc/redis/redis.conf
sudo systemctl enable --now redis-server
redis-cli ping   # should print PONG

# Nginx (reverse proxy + TLS termination)
sudo apt install -y nginx
sudo systemctl enable --now nginx

# Certbot (free TLS via Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx

# PM2 (process manager — this repo's package.json only has start/dev
# scripts, nothing that daemonizes or restarts on crash)
sudo npm install -g pm2
```

### 4.3 Deploy the app

```bash
cd ~
git clone https://github.com/somdevsheel/instachat.git
cd instachat/backend

npm ci --omit=dev
```

Create `backend/.env` (`nano .env`) with production values. Required — matches what `db.js`, `redis.js`, `aws.js`, `sendEmail.js`, and `auth.controller.js` actually read; skip unused legacy keys like `DATABASE_URL`/`DB_HOST`/`STRIPE_*` unless you wire them up:

```
PORT=5000
NODE_ENV=production
MONGO_URI=<Atlas connection string>
JWT_SECRET=<long random value>
JWT_EXPIRES_IN=7d
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
AWS_ACCESS_KEY_ID=<from S3 IAM step>
AWS_SECRET_ACCESS_KEY=<from S3 IAM step>
AWS_REGION=<bucket region>
AWS_BUCKET_NAME=instachat-media-prod
CDN_BASE_URL=https://cdn.yourdomain.com
SMTP_HOST=...
SMTP_PORT=...
SMTP_EMAIL=...
SMTP_PASSWORD=...
LOG_LEVEL=info
```

```bash
chmod 600 .env
```

**MongoDB**: use Atlas rather than self-hosting on the same small instance — Lightsail's smaller tiers don't have the memory/IOPS headroom to run Mongo, Redis, and Node reliably together. Whitelist this instance's static IP in Atlas's network access list.

**Redis config**: open `backend/src/config/redis.js` and confirm the production block (currently commented) is the active one before deploying — it's manually toggled by commenting/uncommenting, not env-driven.

Start it under PM2:

```bash
pm2 start server.js --name instachat-api
pm2 save
pm2 startup systemd   # prints a sudo command — copy/paste and run it, then re-run: pm2 save
```

### 4.4 Nginx reverse proxy + TLS

```bash
sudo tee /etc/nginx/sites-available/instachat-api > /dev/null <<'EOF'
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;   # required for Socket.io
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/instachat-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Issues the cert and rewrites the server block above to redirect 80 -> 443
sudo certbot --nginx -d api.yourdomain.com
```

### 4.5 Verify

```bash
curl https://api.yourdomain.com/api/v1/health
# expect: {"success":true,"message":"Server is healthy and running",...}

pm2 logs instachat-api --lines 50   # tail logs if anything looks off
```

### Make the first admin

```bash
node src/scripts/makeAdmin.js your-email@example.com
```

---

## 5. Admin panel

The Vite build is static output — it doesn't need Node running in production, just a place to serve files from:

```bash
cd admin-panel
npm ci
npm run build   # outputs dist/
```

Simplest option: serve `dist/` from the same Nginx on the Lightsail instance under a subdomain (`admin.yourdomain.com`), pointing `location /api` to `http://127.0.0.1:5000` (mirroring `vite.config.ts`'s dev proxy) so `admin-panel/src/services/api.ts`'s relative `baseURL: '/api/v1'` keeps working unchanged. Alternatively host `dist/` on S3+CloudFront like the media bucket, with the API domain hit directly by the compiled JS (would need `API_BASE` in `api.ts` to become an absolute URL first, since it currently assumes a same-origin proxy).

---

## 6. Mobile app

Before building for release, point the two hardcoded URLs at production (they currently default to a LAN dev IP after our last local-dev fix):
- `frontend/instachat/src/services/api.js` → `API_URL`
- `frontend/instachat/src/services/socket.js` → `SOCKET_URL`

Both should be `https://api.yourdomain.com` (with `/api/v1` appended for `API_URL`). Then build with EAS as usual. If you want to stop hand-editing these per environment, say so — worth wiring to `app.config.js` + `extra` fields instead of hardcoded strings, but that's a separate change from this deployment pass.

---

## Security checklist before going live

- [ ] `JWT_SECRET` is a long random value, not reused from dev
- [ ] `.env` is not committed (confirm `backend/.gitignore` covers it) and file permissions are `600` on the instance
- [ ] Lightsail firewall only allows 22/80/443 inbound; Redis/Mongo (if ever local) not exposed externally
- [ ] S3 bucket keeps Block Public Access on; only CloudFront (via OAC) and the presigned-URL flow touch it
- [ ] CORS on the Express app (`app.js`, currently `origin: '*'`) — consider narrowing to your actual app/admin origins once mobile/admin domains are final
- [ ] `NODE_ENV=production` set, so `morgan('dev')` request logging is off and any dev-only branches are disabled
- [ ] SSH access via key only, password auth disabled on the Lightsail instance

## Rollback

Since deploy is just `git pull` + `pm2 restart`, keep it reversible:
```bash
git log --oneline -5   # find the last good commit
git checkout <commit>
npm ci --omit=dev
pm2 restart instachat-api
```
