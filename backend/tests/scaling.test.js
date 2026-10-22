/**
 * ======================================================
 * MULTI-PROCESS TESTS (Redis adapter + Redis rate limits)
 * ======================================================
 * Starts TWO real server processes sharing MongoDB, PostgreSQL and
 * Redis, and checks realtime events and rate limits work across them.
 *
 * Needs a Redis server: TEST_REDIS_URL (default redis://127.0.0.1:6379/15).
 * Skipped if Redis isn't reachable.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const Redis = require('ioredis');
const { io: ioc } = require('socket.io-client');
const { startTestApp, wait } = require('./helpers/app');

const User = require('../src/models/user.model');
const Chat = require('../src/models/chat.model');

const REDIS_URL = process.env.TEST_REDIS_URL || 'redis://127.0.0.1:6379/15';
const SERVER = path.join(__dirname, '..', 'server.js');

let redisOk = false;
let ctx;
let servers = [];
const ports = [5191, 5192];

const startServer = (port) =>
  new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [SERVER], {
      cwd: os.tmpdir(), // so no real backend/.env is picked up
      env: {
        PATH: process.env.PATH,
        NODE_ENV: 'test',
        LOG_LEVEL: 'info', // startup line below is logged at info
        PORT: String(port),
        MONGO_URI: ctx.mongoUri,
        POSTGRES_URL: ctx.postgresUrl,
        JWT_SECRET: process.env.JWT_SECRET,
        REDIS_URL,
        SOCKET_ADAPTER: process.env.TEST_SOCKET_ADAPTER || 'redis',
        SOCKET_ADAPTER_KEY: `instachat-test-${process.pid}`,
        RATE_LIMIT_STORE: process.env.TEST_RATE_LIMIT_STORE || 'redis',
        AWS_ACCESS_KEY_ID: 'test',
        AWS_SECRET_ACCESS_KEY: 'test',
        AWS_BUCKET_NAME: 'test-bucket',
        AWS_REGION: 'us-east-1',
        SKIP_UPLOAD_VERIFICATION: 'true',
      },
    });
    let out = '';
    const onData = (d) => {
      out += d;
      if (out.includes('Server running')) resolve(proc);
    };
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
    proc.on('exit', (code) => reject(new Error(`server exited ${code}: ${out.slice(-500)}`)));
    setTimeout(() => {
      // Don't leave a half-started server holding the test run open.
      proc.kill('SIGKILL');
      reject(new Error(`server start timeout: ${out.slice(-500)}`));
    }, 20000).unref();
  });

const connect = (port, token) =>
  new Promise((resolve, reject) => {
    const s = ioc(`http://127.0.0.1:${port}`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false,
    });
    s.on('connect', () => resolve(s));
    s.on('connect_error', reject);
  });

const call = async (port, method, url, { token, body } = {}) => {
  const r = await fetch(`http://127.0.0.1:${port}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, json: await r.json().catch(() => null) };
};

before(async () => {
  const probe = new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 0, retryStrategy: () => null });
  try {
    await probe.connect();
    await probe.ping();
    // Clean counters from earlier runs in this test DB only.
    const keys = await probe.keys('rl:*');
    if (keys.length) await probe.del(keys);
    redisOk = true;
  } catch {
    redisOk = false;
  } finally {
    probe.disconnect();
  }
  if (!redisOk) return;

  ctx = await startTestApp();
  servers.push(await startServer(ports[0]));
  servers.push(await startServer(ports[1]));
});

after(async () => {
  for (const p of servers) {
    if (p.exitCode !== null) continue;
    await new Promise((r) => {
      p.once('exit', r);
      p.kill('SIGTERM');
    });
  }
  if (ctx) await ctx.stop();
});

test('message sent via server 1 reaches a user connected to server 2', async (t) => {
  if (!redisOk) return t.skip('Redis not available');

  const [a, b] = await Promise.all([
    User.create({ name: 'a', username: 'scale_a', email: 'a@scale.dev', password: 'password123' }),
    User.create({ name: 'b', username: 'scale_b', email: 'b@scale.dev', password: 'password123' }),
  ]);
  const chat = await Chat.create({ participants: [a._id, b._id], isGroup: false });

  const bSocket = await connect(ports[1], ctx.sign(b.id));
  try {
    const received = new Promise((resolve) => bSocket.on('message_received', resolve));
    const sent = await call(ports[0], 'POST', '/api/v1/chats/message', {
      token: ctx.sign(a.id),
      body: { chatId: chat.id, receiverId: b.id, text: 'across processes' },
    });
    assert.ok([200, 201].includes(sent.status), JSON.stringify(sent.json));

    const msg = await Promise.race([received, wait(3000).then(() => null)]);
    assert.ok(msg, 'server 2 client did not receive the message');
    assert.equal(msg.text, 'across processes');
  } finally {
    bSocket.close();
  }
});

test('failed-login limit is shared across server processes', async (t) => {
  if (!redisOk) return t.skip('Redis not available');

  let last;
  for (let i = 0; i < 11; i++) {
    // Alternate servers: with per-process counters neither would reach 10.
    last = await call(ports[i % 2], 'POST', '/api/v1/auth/login', {
      body: { email: 'shared-limit@scale.dev', password: 'wrong' },
    });
  }
  assert.equal(last.status, 429);
});
