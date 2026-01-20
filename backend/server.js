const http = require('http');
const dotenv = require('dotenv');

/* =========================
   LOAD ENV (FIRST)
========================= */
dotenv.config();

/* =========================
   CRASH SAFETY (SYNC)
========================= */
process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

/* =========================
   IMPORT CORE MODULES
========================= */
const connectDB = require('./src/config/db');
const app = require('./src/app');

// ✅ FIX: import correct socket functions
const { initSocket } = require('./src/services/socket.service');

/* =========================
   CONNECT DATABASE
========================= */
connectDB();

/* =========================
   CREATE HTTP SERVER
========================= */
const server = http.createServer(app);

/* =========================
   INIT SOCKET.IO (🔥 REQUIRED)
========================= */
initSocket(server);

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`⭐️ http://localhost:${PORT}`);
});

/* =========================
   CRASH SAFETY (ASYNC)
========================= */
process.on('unhandledRejection', err => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.stack);

  server.close(() => {
    process.exit(1);
  });
});
