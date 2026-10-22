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
  - build in a matching container: `docker run --rm -v "$PWD":/var/task public.ecr.aws/sam/build-nodejs24.x npm install --arch=x64 --platform=linux --libc=glibc sharp`, or
  - use a prebuilt Lambda Layer for `sharp` (several public ones exist), or
  - package as a **container image** Lambda instead of a zip (simplest to get right).
- Runtime: Node.js 24.x (Node 20 is end-of-life since April 2026 — no security fixes), memory ≥512MB (image resizing is CPU-bound — more memory also means more vCPU on Lambda), timeout ~30s.

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

SSH in (`ssh ubuntu@<static-ip>`) and run this end-to-end — system packages, Node 24 LTS, Redis, Nginx, Certbot, PM2:

```bash
# System update
sudo apt update && sudo apt upgrade -y

# Node.js 24 LTS via NodeSource (apt-based, not nvm — plays cleanly with
# systemd/pm2 startup, which nvm's per-user PATH setup often fights with).
# Node 20 reached end-of-life in April 2026; the backend needs >= 20.19.
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs git build-essential

node -v   # sanity check: v24.x
npm -v

# Redis (self-hosted on this same instance; redis.js defaults to
# 127.0.0.1:6379). In production it backs rate limits, logout/session
# revocation and the Socket.IO cross-process adapter.
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
POSTGRES_URL=postgres://<user>:<password>@<host>:5432/instachat
POSTGRES_SSL=true
ALLOWED_ORIGINS=https://app.yourdomain.com,https://admin.yourdomain.com
JWT_SECRET=<long random value, min 32 chars: openssl rand -hex 48>
# Login session length. The code now honors this value (it used to be
# ignored and tokens always lasted 30d) — keep 30d to avoid weekly logouts.
JWT_EXPIRES_IN=30d
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

**Redis config**: env-driven (`REDIS_URL`, or `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD`); no file editing needed.

**PostgreSQL** (social graph: follows, blocks, mutes, close friends — everything else stays in MongoDB): use a managed instance (Lightsail managed database, RDS, Neon, Supabase), PostgreSQL 14+. Allow this instance's static IP, create a database (e.g. `instachat`), and set `POSTGRES_URL` / `POSTGRES_SSL` above. The server refuses to start if the schema is behind.

First-time rollout of the PostgreSQL split (existing data lives in MongoDB arrays):

```bash
npm run db:migrate                                   # create tables (re-run on every deploy; no-op if current)
node db/scripts/migrateGraphToPostgres.js --dry-run  # preview counts
npm run db:copy-graph                                # copy follows/blocks/mutes/close friends
pm2 restart instachat-api                            # (or start, below)
npm run db:copy-graph                                # run again right after: catches anything written by
                                                     # the old version during the switchover (idempotent)
```

Check `curl https://api.yourdomain.com/api/v1/health/ready` returns `"mongo":"ok","postgres":"ok"`. The old MongoDB arrays are left in place (read-only) as a backup.

On later deploys just run `npm run db:migrate` before restarting.

Start it under PM2 in **cluster mode** (one process per CPU core):

```bash
pm2 start server.js --name instachat-api -i max
pm2 save
pm2 startup systemd   # prints a sudo command — copy/paste and run it, then re-run: pm2 save
```

Running several processes (or several instances behind a load balancer) is supported because, in production, rate-limit counters, revoked sessions and Socket.IO events go through Redis (`RATE_LIMIT_STORE` / `SOCKET_ADAPTER` default to `redis` when `NODE_ENV=production`). Clients connect with WebSocket only, so no sticky sessions are needed.

> **Rollout order:** app builds released before this change connect with long-polling first, and that breaks when requests are spread over several processes. Until most users have the WebSocket-only app update, run a **single** process (`pm2 start server.js --name instachat-api`, without `-i max`), then switch to cluster mode. `npm test` includes a two-process test that proves both. If several environments share one Redis, give each its own `SOCKET_ADAPTER_KEY` and Redis database number.

Optional production settings for `backend/.env`:

```
SENTRY_DSN=<from sentry.io>      # error reporting; off when unset
LOG_LEVEL=info                   # logs are JSON lines in production
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

### Security headers for the web app and admin panel

Both production builds include a Content-Security-Policy `<meta>` tag, generated at build time by the two `vite.config` files. It allows:

- scripts only from the app's own origin: no inline scripts, no `eval`, and Trusted Types enforced, which blocks HTML injected through `innerHTML`-style DOM APIs
- network calls only to the API, its WebSocket and **your** S3 bucket
- images and video only from your CDN and bucket

This was checked in Chrome on every main page of both apps against a real backend: no violations, and injected scripts and HTML were blocked.

The policy is built from env variables, and `vite build` **fails** if a required one is missing:

| App | Required | Optional |
|---|---|---|
| web (`frontend/web`) | `VITE_API_URL`, `VITE_CDN_URL`, `VITE_S3_BUCKET_URL` | `VITE_SOCKET_URL` (defaults to the API origin) |
| admin (`admin-panel`) | `VITE_CDN_URL` | `VITE_S3_BUCKET_URL` (legacy media URLs) |

If you change a domain, rebuild. A clickjacking guard can't be set from a `<meta>` tag, so add these lines inside each static site's nginx `server { }` block:

```nginx
add_header Content-Security-Policy "frame-ancestors 'none'" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

**Optional: get alerted to blocked attacks.** A `<meta>` policy can't report violations. To have browsers report them to Sentry:
1. Copy the policy from the built `dist/index.html` (the `content="..."` of the CSP `<meta>` tag).
2. Send it as a report-only header with your Sentry CSP report URL appended (Sentry → Project Settings → Security Headers):

```nginx
add_header Content-Security-Policy-Report-Only "<the exact policy from dist/index.html>; report-uri https://o0.ingest.sentry.io/api/<project>/security/?sentry_key=<key>" always;
```

It has to be the same policy, or Sentry fills with false alarms. Report-only never blocks anything itself; the `<meta>` tag does the enforcing.

## 6. Mobile app

The API and socket URLs come from `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_SOCKET_URL` (see `frontend/instachat/.env.example`) and default to `https://api.grownoww.com`. For local development put your LAN IP in `frontend/instachat/.env` (gitignored). Then build with EAS as usual.

Ship the app update together with this backend release: private accounts, follow requests, email-change verification and server-side logout all need the new screens.

---

## Terms and Privacy Policy

The web app serves public pages at `/terms` and `/privacy`, linked from sign-up (web and mobile) and from Settings. They describe what the app actually does. Before launch:

1. Fill in `frontend/web/src/pages/legal/legalConfig.js`: company name, address, contact emails, governing law, hosting region and log/backup retention. Until you do, both pages show a "Draft" banner.
2. Have a lawyer review the text for the countries you operate in.
3. Give `https://<your web domain>/privacy` to the App Store and Play Store as the privacy policy URL, and fill in their data-safety forms to match it.
4. Set `EXPO_PUBLIC_WEB_URL` for the mobile build so its links point at these pages.
5. When the terms change materially, bump `version` in `legalConfig.js` **and** `TERMS_VERSION` in `backend/src/controllers/auth.controller.js`. Each user's acceptance is stored with the version they agreed to.

## Security checklist before going live

- [ ] `JWT_SECRET` is a long random value, not reused from dev
- [ ] `.env` is not committed (confirm `backend/.gitignore` covers it) and file permissions are `600` on the instance
- [ ] Lightsail firewall only allows 22/80/443 inbound; Redis/Mongo (if ever local) not exposed externally
- [ ] S3 bucket keeps Block Public Access on; only CloudFront (via OAC) and the presigned-URL flow touch it
- [ ] `ALLOWED_ORIGINS` lists exactly your web + admin origins (CORS fails closed in production without it)
- [ ] `NODE_ENV=production` set (JSON logs, debug logs off, Redis-backed limits/sockets, internal error details hidden)
- [ ] `SENTRY_DSN` set and a test error shows up in Sentry
- [ ] Backups scheduled AND one restore drill done (section 7)
- [ ] Load test run against staging (section 8)
- [ ] SSH access via key only, password auth disabled on the Lightsail instance

## 7. Monitoring and backups

**Health checks.** Point an uptime monitor (UptimeRobot, Better Stack, CloudWatch Synthetics) at `https://api.yourdomain.com/api/v1/health/ready`. It returns 503 if MongoDB or PostgreSQL is unreachable. `/api/v1/health` is a plain liveness check.

**Logs.** In production every line is JSON with `requestId`, `method`, `path`, `status`, `durationMs`, `userId`. Every response carries an `X-Request-Id` header, and error responses include `requestId`, so a user's bug report can be matched to its log lines and its Sentry event. Ship PM2's logs to your aggregator (e.g. the CloudWatch agent, or `pm2 install pm2-logrotate` at minimum).

**Backups.** First turn on your providers' own backups: MongoDB Atlas continuous backup, and automated backups / point-in-time recovery on managed PostgreSQL. Then add an off-site copy of both databases with `backend/ops/backup.sh`, which needs `mongodb-database-tools`, `postgresql-client` and the AWS CLI:

```bash
# backend/.env:  BACKUP_S3_URI=s3://instachat-backups/prod   (separate bucket: versioning on, public access blocked, lifecycle expiry e.g. 30 days)
15 3 * * * cd /home/ubuntu/instachat/backend && ./ops/backup.sh >> /home/ubuntu/backup.log 2>&1
```

**Restore drill (do this before launch).** Restore the latest backup into scratch databases and check the counts:

```bash
./ops/restore.sh s3://instachat-backups/prod/<timestamp> "<scratch mongo uri>" "<scratch postgres url>"
```

## 8. Load testing

Before launch, run `backend/ops/loadtest.k6.js` with [k6](https://k6.io) against a staging copy that has production-sized data (instructions are at the top of the file). It fails if p95 latency is over 500 ms or more than 1% of requests error. Keep the instance's CPU, memory and database metrics open during the run, since they show which part saturates first.

## Rollback

Since deploy is just `git pull` + `pm2 restart`, keep it reversible. Database migrations only ever add tables, so older code keeps working against a newer schema. Rolling back past the PostgreSQL split is the exception: follows made since then exist only in PostgreSQL.

```bash
git log --oneline -5   # find the last good commit
git checkout <commit>
npm ci --omit=dev
pm2 restart instachat-api
```
