const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');
const {
  register,
  login,
  getMe,
} = require('../controllers/auth.controller');

/* =========================
   REGISTER
========================= */
router.post('/register', register);

/* =========================
   LOGIN
========================= */
router.post('/login', login);

/* =========================
   GET CURRENT USER
========================= */
router.get('/me', protect, getMe);

module.exports = router;
