/**
 * ======================================================
 * LOAD TEST (k6 — https://k6.io)
 * ======================================================
 * Simulates logged-in users browsing: feed, reels, chat list,
 * notifications, a profile, suggestions. Run against STAGING with
 * production-sized data — never against production.
 *
 *   k6 run -e BASE_URL=https://staging-api.example.com \
 *          -e TOKENS=tok1,tok2,tok3 \
 *          -e PROFILE=someusername \
 *          ops/loadtest.k6.js
 *
 * TOKENS: JWTs for a few test accounts (log in as them first). Using
 * several spreads load across users like real traffic does.
 *
 * Note: the API rate limit is 300 requests / 15 min per IP. Run from a
 * few machines, or temporarily raise it on staging, or k6 will mostly
 * measure 429s.
 *
 * The run FAILS if p95 latency > 500ms or more than 1% of requests
 * error — tune the thresholds to your own targets.
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';

const BASE = __ENV.BASE_URL;
const TOKENS = (__ENV.TOKENS || '').split(',').filter(Boolean);
const PROFILE = __ENV.PROFILE || '';

if (!BASE || TOKENS.length === 0) {
  throw new Error('Set BASE_URL and TOKENS (comma-separated JWTs)');
}

export const options = {
  stages: [
    { duration: '1m', target: 20 },  // ramp up
    { duration: '3m', target: 100 }, // sustained load
    { duration: '1m', target: 200 }, // spike
    { duration: '1m', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

const get = (path, token, name) => {
  const res = http.get(`${BASE}/api/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { name },
  });
  check(res, { [`${name} 200`]: (r) => r.status === 200 });
  return res;
};

export default function () {
  const token = TOKENS[__VU % TOKENS.length];

  group('home', () => {
    get('/feed?page=1&limit=10', token, 'feed');
    get('/stories/feed', token, 'stories');
    get('/notifications/unread-count', token, 'unread');
  });
  sleep(1 + Math.random() * 2);

  group('browse', () => {
    get('/reels/feed?page=1&limit=10', token, 'reels');
    if (PROFILE) get(`/users/profile/${PROFILE}`, token, 'profile');
    get('/users/suggestions', token, 'suggestions');
  });
  sleep(1 + Math.random() * 2);

  group('messages', () => {
    get('/chats', token, 'chats');
    get('/notifications', token, 'notifications');
  });
  sleep(2 + Math.random() * 3);
}
