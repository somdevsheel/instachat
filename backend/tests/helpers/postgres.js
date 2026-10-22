/**
 * Throwaway PostgreSQL for tests.
 *
 * - If TEST_POSTGRES_URL is set (CI service container, etc.), a fresh
 *   database is created on that server per test file and dropped after
 *   (the URL's user needs CREATEDB; PostgreSQL 13+ for DROP ... FORCE).
 * - Otherwise a temporary cluster is created with the locally installed
 *   `initdb` / `postgres` binaries (PATH or /usr/lib/postgresql/<v>/bin)
 *   on a free port, and deleted afterwards.
 */
const fs = require('fs');
const os = require('os');
const net = require('net');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { Client } = require('pg');

const findBinDir = () => {
  try {
    const initdb = execFileSync('which', ['initdb']).toString().trim();
    if (initdb) return path.dirname(initdb);
  } catch {}
  const base = '/usr/lib/postgresql';
  if (fs.existsSync(base)) {
    const versions = fs.readdirSync(base).sort((a, b) => Number(b) - Number(a));
    for (const v of versions) {
      const dir = path.join(base, v, 'bin');
      if (fs.existsSync(path.join(dir, 'initdb'))) return dir;
    }
  }
  return null;
};

const freePort = () =>
  new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });

const waitForReady = async (url, timeoutMs = 20000) => {
  const start = Date.now();
  for (;;) {
    const client = new Client({ connectionString: url });
    try {
      await client.connect();
      await client.end();
      return;
    } catch (err) {
      await client.end().catch(() => {});
      if (Date.now() - start > timeoutMs) throw err;
      await new Promise((r) => setTimeout(r, 200));
    }
  }
};

const startTestPostgres = async () => {
  if (process.env.TEST_POSTGRES_URL) {
    // Shared server (CI service container): give each test file its own
    // throwaway database so files can't see each other's rows.
    const admin = new Client({ connectionString: process.env.TEST_POSTGRES_URL });
    await admin.connect();
    const dbName = `instachat_test_${process.pid}_${Date.now()}`;
    await admin.query(`CREATE DATABASE ${dbName}`);
    await admin.end();

    const url = new URL(process.env.TEST_POSTGRES_URL);
    url.pathname = `/${dbName}`;

    const stop = async () => {
      const c = new Client({ connectionString: process.env.TEST_POSTGRES_URL });
      await c.connect();
      await c.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`);
      await c.end();
    };
    return { url: url.toString(), stop };
  }

  const binDir = findBinDir();
  if (!binDir) {
    throw new Error(
      'No PostgreSQL binaries found. Install PostgreSQL or set TEST_POSTGRES_URL.'
    );
  }

  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'instachat-pg-'));
  execFileSync(
    path.join(binDir, 'initdb'),
    ['-D', dataDir, '-U', 'postgres', '--auth=trust', '-E', 'UTF8'],
    { stdio: 'ignore' }
  );

  const port = await freePort();
  const proc = spawn(
    path.join(binDir, 'postgres'),
    ['-D', dataDir, '-p', String(port), '-k', dataDir, '-c', 'listen_addresses=127.0.0.1', '-c', 'fsync=off'],
    { stdio: 'ignore' }
  );

  const url = `postgres://postgres@127.0.0.1:${port}/postgres`;
  await waitForReady(url);

  const stop = async () => {
    await new Promise((resolve) => {
      proc.once('exit', resolve);
      proc.kill('SIGINT');
    });
    fs.rmSync(dataDir, { recursive: true, force: true });
  };

  return { url, stop };
};

module.exports = { startTestPostgres };
