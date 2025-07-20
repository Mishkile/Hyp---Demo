const express = require('express');
const {
  register,
  login,
  getMe
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { registerSchema, loginSchema } = require('../validation/schemas');

const router = express.Router();

// @route   POST /api/v1/auth/register
router.post('/register', validate(registerSchema), register);

// @route   POST /api/v1/auth/login
router.post('/login', validate(loginSchema), login);

// @route   GET /api/v1/auth/me
router.get('/me', auth, getMe);

module.exports = router;