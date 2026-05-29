const express = require('express');
const {
  registerToken,
  unregisterToken,
  testNotification,
} = require('../controllers/deviceController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

// POST /api/devices/register-token
router.post('/register-token', registerToken);

// DELETE /api/devices/unregister-token
router.delete('/unregister-token', unregisterToken);

// POST /api/devices/test-notification
router.post('/test-notification', testNotification);

module.exports = router;
