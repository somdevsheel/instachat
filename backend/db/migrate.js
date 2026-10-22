/**
 * ======================================================
 * POSTGRES MIGRATION RUNNER
 * ======================================================
 * Applies db/migrations/*.sql in filename order, each in its own
 * transaction, recording applied files in `schema_migrations`.
 * Safe to run repeatedly (already-applied files are skipped).
 *
 *   npm run db:migrate
 */
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const runMigrations = async (pool, { log = console.log } = {}) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const { rows } = await pool.query('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.name));

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      log(`✅ Applied migration ${file}`);
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw new Error(`Migration ${file} failed: ${err.message}`);
    } finally {
      client.release();
    }
  }
};

/** Migration files not yet applied (empty array = schema up to date). */
const pendingMigrations = async (pool) => {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  let applied = new Set();
  try {
    const { rows } = await pool.query('SELECT name FROM schema_migrations');
    applied = new Set(rows.map((r) => r.name));
  } catch (err) {
    if (err.code !== '42P01') throw err; // undefined_table: nothing applied
  }
  return files.filter((f) => !applied.has(f));
};

module.exports = { runMigrations, pendingMigrations };

if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  const { pool } = require('../src/config/postgres');

  runMigrations(pool)
    .then(() => {
      console.log('Migrations up to date.');
      return pool.end();
    })
    .catch((err) => {
      console.error(`❌ ${err.message}`);
      process.exit(1);
    });
}
