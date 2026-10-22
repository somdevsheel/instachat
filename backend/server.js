const http = require('http');
const dotenv = require('dotenv');

/* =========================
   LOAD ENV (FIRST)
========================= */
dotenv.config();

/* =========================
   VALIDATE ENV (BEFORE ANYTHING ELSE TOUCHES IT)
========================= */
require('./src/config/validateEnv')();

const logger = require('./src/utils/logger');
const errorReporter = require('./src/utils/errorReporter');

// Error reporting (Sentry) — no-op unless SENTRY_DSN is set.
errorReporter.init();

/* =========================
   CRASH SAFETY (SYNC)
========================= */
process.on('uncaughtException', async (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
  await errorReporter.flush();
  process.exit(1);
});

/* =========================
   IMPORT CORE MODULES
========================= */
const connectDB = require('./src/config/db');
const app = require('./src/app');
const mongoose = require('mongoose');
const redis = require('./src/config/redis');
const { initSocket, getIO } = require('./src/services/socket.service');
const { pool: pgPool, connectPostgres } = require('./src/config/postgres');
const { pendingMigrations } = require('./db/migrate');

/* =========================
   CONNECT DATABASES
   MongoDB: documents. PostgreSQL: social graph.
========================= */
connectDB();

connectPostgres().then(async () => {
  const pending = await pendingMigrations(pgPool);
  if (pending.length) {
    logger.error(
      `💥 PostgreSQL schema is out of date (pending: ${pending.join(', ')}). Run: npm run db:migrate`
    );
    process.exit(1);
  }
});

/* =========================
   CREATE HTTP SERVER (ONLY ONCE)
========================= */
const server = http.createServer(app);

/* =========================
   INIT SOCKET.IO
========================= */
initSocket(server);

// Controllers read the io instance via req.app.get('io') for realtime
// broadcasts (likes, new reels, ...). Without this they silently no-op.
app.set('io', getIO());

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
  logger.info(`⭐️ http://localhost:${PORT}`);
});

/* =========================
   GRACEFUL SHUTDOWN
========================= */
const shutdown = (signal, exitCode = 0) => {
  logger.info(`${signal} received — shutting down gracefully...`);

  // Force-exit if connections don't drain in time.
  setTimeout(() => process.exit(exitCode || 1), 10000).unref();

  getIO().close();
  server.close(async () => {
    try {
      await mongoose.connection.close(false);
    } catch {}
    try {
      await pgPool.end();
    } catch {}
    try {
      await redis.quit();
    } catch {}
    await errorReporter.flush();
    process.exit(exitCode);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

/* =========================
   CRASH SAFETY (ASYNC)
========================= */
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', err instanceof Error ? err : new Error(String(err)));
  shutdown('unhandledRejection', 1);
});
