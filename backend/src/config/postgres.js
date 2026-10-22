const { Pool } = require('pg');
const logger = require('../utils/logger');

/**
 * ======================================================
 * POSTGRESQL (RELATIONAL DATA)
 * ======================================================
 * MongoDB holds documents (users, posts, reels, stories, chats...).
 * PostgreSQL holds relationships between users: follows, blocks,
 * mutes and close friends (see db/migrations). Rows reference users
 * by their MongoDB ObjectId (24-char hex string).
 *
 *   POSTGRES_URL   postgres://user:pass@host:5432/instachat
 *   POSTGRES_SSL   "true" to require TLS (most managed providers)
 *   POSTGRES_POOL_MAX  default 10
 */
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: Number(process.env.POSTGRES_POOL_MAX) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl:
    process.env.POSTGRES_SSL === 'true'
      ? { rejectUnauthorized: process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : undefined,
});

pool.on('error', (err) => {
  // Idle client errors (e.g. server restart). The pool replaces the client.
  logger.error('🔴 PostgreSQL pool error:', err.message);
});

const query = (text, params) => pool.query(text, params);

/**
 * Run `fn(client)` inside a transaction. Rolls back on any error.
 */
const withTransaction = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
};

const connectPostgres = async () => {
  try {
    await pool.query('SELECT 1');
    logger.info('✅ PostgreSQL Connected');
  } catch (err) {
    logger.error(`❌ PostgreSQL Connection Error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = { pool, query, withTransaction, connectPostgres };
