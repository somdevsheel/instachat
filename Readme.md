# InstaChat

A full-stack Instagram-style social app: feed, stories, reels, real-time chat, notifications, and an admin/moderation panel.

## Project Structure

```
backend/               Node/Express + MongoDB + Redis + Socket.io API
frontend/instachat/     React Native (Expo) mobile app
admin-panel/            React + Vite + TypeScript admin dashboard
```

## Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- Redis instance
- AWS S3 bucket (media storage/uploads)
- Expo CLI (`npx expo`) and an Expo/EAS account for the mobile app

## Backend

```bash
cd backend
npm install
```

Create `backend/.env` with:

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/instachat
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
AWS_BUCKET_NAME=...
CDN_BASE_URL=...
SMTP_HOST=...
SMTP_PORT=...
SMTP_EMAIL=...
SMTP_PASSWORD=...
LOG_LEVEL=info
```

Redis connection mode (local vs. production) is toggled manually in `backend/src/config/redis.js` — comment/uncomment the relevant block for your environment.

Run it:

```bash
npm run dev     # nodemon, auto-restart
npm start       # plain node
```

The API is mounted at `http://localhost:5000/api/v1`.

### Make yourself an admin

Needed to log into the admin panel:

```bash
node src/scripts/makeAdmin.js your-email@example.com
# or
node src/scripts/makeAdmin.js --username yourusername
```

### Other maintenance scripts

```bash
node src/scripts/deleteAllStories.js         # wipe all stories
node src/scripts/deleteCorruptedStories.js   # clean up malformed story docs
node src/scripts/resetPassword.js            # manual password reset
node src/scripts/testEmail.js                # verify SMTP config
node cleanup.js                              # cleanup pass (see file for scope)
node cleanup-malformed-keys.js               # clean malformed chat-key records
```

## Mobile app (frontend/instachat)

```bash
cd frontend/instachat
npm install
```

Point the app at your backend by editing `API_URL` in `src/services/api.js`.

```bash
npx expo start
```

Camera, video, and push notifications rely on native modules, so a custom dev client is required for full functionality (Expo Go alone won't cover everything):

```bash
npx expo run:android   # or
npx expo run:ios
```

### Push notifications (optional)

Push is implemented via `expo-notifications` + the Expo push service. Before it will actually deliver:

1. Run `eas init` in `frontend/instachat/` to attach an EAS project ID (`app.json` → `extra.eas.projectId`).
2. Upload your Firebase FCM V1 service-account credentials via `eas credentials` (required for Android since Google retired the legacy FCM API — iOS APNs is handled automatically by EAS).
3. Build with a dev client or a production build — push tokens aren't available in Expo Go.

### Android release build

```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

## Admin panel

```bash
cd admin-panel
npm install
npm run dev
```

Runs at `http://localhost:5173` and proxies `/api` requests to `http://localhost:5000` (see `vite.config.ts`) — update the proxy target if your backend runs elsewhere. Log in with an account promoted via `makeAdmin.js`.
