/**
 * ======================================================
 * REDIS CONFIGURATION
 * ======================================================
 * 
 * 👉 HOW TO USE:
 * 
 * LOCAL DEVELOPMENT:
 * - Comment PRODUCTION block
 * - Uncomment LOCAL block
 * 
 * PRODUCTION SERVER:
 * - Comment LOCAL block
 * - Uncomment PRODUCTION block
 * 
 * This file is MANUALLY controlled by you.
 * No env confusion. No hidden behavior.
 */

/* ======================================================
   🔹 IMPORT
====================================================== */
let redis;

/* ======================================================
   🧪 LOCAL DEVELOPMENT CONFIG
   (USE THIS WHILE DEVELOPING LOCALLY)
====================================================== */


try {
  const Redis = require('ioredis');

  redis = new Redis({
    host: '127.0.0.1',
    port: 6379,

    // LOCAL SAFE SETTINGS
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // ❌ no reconnect spam
  });

  console.log('⚠️ Redis LOCAL mode (optional)');

} catch (err) {
  console.warn('⚠️ Redis disabled (LOCAL DEV)');

  // NO-OP Redis (APP NEVER CRASHES)
  redis = {
    get: async () => null,
    set: async () => null,
    del: async () => null,
    incr: async () => 1,
    expire: async () => null,
    exists: async () => 0,
    info: async () => '',
  };
}


/* ======================================================
   🚀 PRODUCTION SERVER CONFIG
   (USE THIS WHEN DEPLOYING)
====================================================== */

// try {
//   const Redis = require('ioredis');

//   redis = new Redis({
//     host: process.env.REDIS_HOST || '127.0.0.1',
//     port: process.env.REDIS_PORT
//       ? Number(process.env.REDIS_PORT)
//       : 6379,

//     // PRODUCTION SAFE SETTINGS
//     maxRetriesPerRequest: 5,
//     enableReadyCheck: true,

//     retryStrategy(times) {
//       return Math.min(times * 100, 3000);
//     },
//   });

//   redis.on('connect', () => {
//     console.log('🟢 Redis connected (PRODUCTION)');
//   });

//   redis.on('error', (err) => {
//     console.error('🔴 Redis error:', err.message);
//   });

// } catch (err) {
//   console.error('❌ Redis failed to initialize (PRODUCTION)');
//   throw err; // ❗ Production SHOULD fail if Redis is missing
// }

/* ======================================================
   EXPORT
====================================================== */
module.exports = redis;
