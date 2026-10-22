/**
 * Boots the real app in-process against throwaway MongoDB + PostgreSQL.
 * Redis is optional (callers fail open).
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_for_automated_tests_only_0123456789';
process.env.AWS_BUCKET_NAME = 'test-bucket';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test';
process.env.AWS_SECRET_ACCESS_KEY = 'test';
process.env.SMTP_HOST = '127.0.0.1';
process.env.SMTP_PORT = '1';
process.env.SKIP_UPLOAD_VERIFICATION = 'true'; // no S3 in tests
process.env.CDN_BASE_URL = 'https://cdn.test'; // never pick up the real one from .env
// Separate Redis DB so test keys never mix with local dev data.
process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://127.0.0.1:6379/15';

const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { io: ioc } = require('socket.io-client');
const { startTestPostgres } = require('./postgres');

const startTestApp = async () => {
  const mongo = await MongoMemoryServer.create();
  const pg = await startTestPostgres();

  // Must be set before the app (and config/postgres) is first required.
  process.env.MONGO_URI = mongo.getUri();
  process.env.POSTGRES_URL = pg.url;

  const app = require('../../src/app');
  const { initSocket, getIO } = require('../../src/services/socket.service');
  const redis = require('../../src/config/redis');
  const { pool } = require('../../src/config/postgres');
  const { runMigrations } = require('../../db/migrate');

  await mongoose.connect(mongo.getUri());
  await runMigrations(pool, { log: () => {} });
  await require('../../src/models/Otp.model').syncIndexes();

  const server = http.createServer(app);
  initSocket(server);
  app.set('io', getIO());
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const BASE = `http://127.0.0.1:${server.address().port}`;

  const api = async (method, url, { token, body } = {}) => {
    const r = await fetch(BASE + url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let json = null;
    try {
      json = await r.json();
    } catch {}
    return { status: r.status, json };
  };

  const sign = (id, extra = {}) =>
    jwt.sign({ id, ...extra }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const connect = (token) =>
    new Promise((resolve) => {
      const s = ioc(BASE, { auth: { token }, transports: ['websocket'], reconnection: false });
      s.on('connect', () => resolve({ s, ok: true }));
      s.on('connect_error', (e) => resolve({ s, ok: false, err: e.message }));
    });

  const stop = async () => {
    getIO().close();
    await new Promise((r) => server.close(r));
    await mongoose.disconnect();
    await pool.end();
    await mongo.stop();
    await pg.stop();
    redis.disconnect();
  };

  return { BASE, api, sign, connect, stop, pool, redis, mongoUri: mongo.getUri(), postgresUrl: pg.url };
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = { startTestApp, wait };
