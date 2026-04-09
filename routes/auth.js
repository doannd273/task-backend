const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  logout,
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/refresh-token
router.post('/refresh-token', refreshToken);

// POST /api/auth/logout (cần xác thực)
router.post('/logout', authMiddleware, logout);

// POST /api/auth/forgot-password
const { forgotPassword } = require('../controllers/authController');
router.post('/forgot-password', forgotPassword);

module.exports = router;
