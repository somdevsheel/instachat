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
const { initSocket } = require('./src/services/socket.service');

/* =========================
   CONNECT DATABASE
========================= */
connectDB();

/* =========================
   CREATE HTTP SERVER (ONLY ONCE)
========================= */
const server = http.createServer(app);

/* =========================
   INIT SOCKET.IO
========================= */
initSocket(server);

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
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
