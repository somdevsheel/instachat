# S3 + CloudFront Setup — InstaChat Media

## ✅ Status: Live

| | |
|---|---|
| CDN domain | `https://d1n8998kuqca92.cloudfront.net` |
| Distribution ID | `E270KT87566BHQ` |
| Origin | `instachattt.s3.ap-south-1.amazonaws.com` (via OAC) |
| `backend/.env` | `CDN_BASE_URL=https://d1n8998kuqca92.cloudfront.net` — applied, backend restarted |
| Bucket policy | Scoped to distribution `E270KT87566BHQ` only (old dead-distribution reference removed) |
| Verified | `curl -I` against a real object returns `HTTP/2 200`, `Content-Type: image/jpeg` |

New posts, reels, stories, and profile photos uploaded from here on will resolve correctly. The steps below are kept for reference (e.g. if the distribution ever needs to be recreated again).

## Original state (before this fix — kept for context)

- **S3 bucket**: `instachattt`, region `ap-south-1` — already existed, already had real objects in it, Block Public Access was **ON** for all four settings (correct — CloudFront reads it via Origin Access Control, not a public bucket).
- **CORS**: was missing entirely (that's why direct browser uploads via presigned URL were failing with "Failed to fetch") — fixed: `GET/PUT/POST/HEAD` from any origin.
- **CloudFront**: the account had two *unrelated* distributions (`d14ffvfop2p6yc.cloudfront.net` → bucket `freenoo`, `d3l2dl327bj8j0.cloudfront.net` → bucket `mediatool`) — neither served `instachattt`.
- **The actual problem**: `instachattt`'s bucket policy granted read access to a CloudFront distribution with ID `E2RLBD4XGEAOVG` — which no longer existed (deleted at some point). `CDN_BASE_URL=https://d3n1st9gh9yfhn.cloudfront.net` in `backend/.env` was that dead distribution's domain. Not a from-scratch setup — needed a new distribution reconnected to the bucket.

---

## Step 1 — Create an Origin Access Control (OAC)

CloudFront console → **Origin access** (left sidebar) → **Create control setting**
- Name: `instachattt-oac`
- Signing behavior: **Sign requests (recommended)**
- Origin type: **S3**

This is the mechanism that lets CloudFront read the private bucket without it being publicly accessible.

## Step 2 — Create the distribution

CloudFront console → **Distributions** → **Create distribution**

- **Origin domain**: select `instachattt.s3.ap-south-1.amazonaws.com` from the dropdown (do **not** hand-type it — picking from the dropdown is what lets the console auto-detect it's S3 and offer OAC)
- **Origin access**: select **Origin access control settings** → pick `instachattt-oac` from Step 1
- **Viewer protocol policy**: Redirect HTTP to HTTPS
- **Allowed HTTP methods**: GET, HEAD (this bucket is only ever read through CloudFront — writes go straight to S3 via presigned URLs, bypassing CloudFront entirely)
- **Cache policy**: `CachingOptimized` is fine — the app already sends the right `Cache-Control` headers per object (`immutable` for images, 1-day for video), so CloudFront's default caching behavior respects that correctly
- Leave WAF disabled unless you specifically want it (extra cost, not needed for this use case)
- Create the distribution

After creation, CloudFront will show a banner: **"The S3 bucket policy needs to be updated"** with a **Copy policy** button. Use it — don't write the policy by hand, since it needs the exact new distribution's ARN.

## Step 3 — Apply the bucket policy

S3 console → `instachattt` → **Permissions** tab → **Bucket policy** → **Edit**

Paste the policy CloudFront gives you. The live policy currently applied is:

```json
{
  "Version": "2008-10-17",
  "Id": "PolicyForCloudFrontPrivateContent",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::instachattt/*",
      "Condition": {
        "ArnLike": { "AWS:SourceArn": "arn:aws:cloudfront::844937519774:distribution/E270KT87566BHQ" }
      }
    }
  ]
}
```

This **replaces** the existing policy — don't keep old statements referencing dead distribution IDs around (the previous one, `E2RLBD4XGEAOVG`, has already been removed).

## Step 4 — Wait for deployment

The distribution takes 5–15 minutes to reach `Deployed` status after creation. Check the CloudFront console — don't move on until it says Deployed, or you'll get an error testing it.

## Step 5 — Test it directly

Once deployed, test the new domain against a real object. This is the exact command that confirmed the current setup is working:

```bash
curl -I https://d1n8998kuqca92.cloudfront.net/users/696e051b48033304d96387d8/posts/images/1783197570409-gmyh7mmvm0o.jpeg
```

Confirmed response: `HTTP/2 200`, `Content-Type: image/jpeg`. If you get `403`, the bucket policy or OAC binding is off — recheck Step 3.

## Step 6 — Point the app at it

`backend/.env` — already applied:
```
CDN_BASE_URL=https://d1n8998kuqca92.cloudfront.net
```

The backend needs a full restart to pick this up — `nodemon` only watches `.js/.json` files, **not** `.env`, so editing the file alone doesn't apply it. Restart with `pm2 restart instachat-api` in prod, or kill and re-run `npm run dev` locally.

---

## Existing content: migration already run

`CDN_BASE_URL` is read at the moment a post/story/reel is created and baked directly into the stored URL (`media.variants.original`, `media.url`, `videoUrl`, etc. in MongoDB) — it isn't recomputed on read. So fixing the env var alone only affects *new* uploads going forward.

`backend/src/scripts/fixMediaDomain.js` was written for this and already run once:

```bash
node src/scripts/fixMediaDomain.js d3c0e9xew1opgc.cloudfront.net
```

It rewrote every stored URL from the old dead domain to the current `CDN_BASE_URL` — 11 posts and 7 reels updated. Re-run it (with a different old-domain argument) any time the CDN domain changes again.

**Separate, still-open issue found during verification**: after the rewrite, none of those 18 records' underlying S3 objects actually exist in the bucket (`HeadObject` returns `NotFound` for all of them) — likely pre-existing seed/demo data or objects lost from an earlier bucket, unrelated to the CDN misconfiguration itself. Decision made: leave them as-is: `PostMedia`/`Avatar` components already show a graceful "Image unavailable" / initials fallback rather than a broken-image icon, so no user-facing crash — just a placeholder for that historical content.

---

## Optional: custom domain instead of the raw `*.cloudfront.net` URL

If you want `cdn.yourdomain.com` instead of the auto-generated CloudFront domain, that needs an ACM certificate issued in **us-east-1** (required regardless of your bucket's actual region) attached to the distribution, plus a DNS CNAME/ALIAS record pointing at the CloudFront domain. Not required for things to work — purely cosmetic/branding. Say the word if you want that added.
