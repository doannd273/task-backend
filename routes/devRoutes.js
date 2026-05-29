const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { triggerDueDateReminder } = require('../controllers/devController');

const router = express.Router();

router.use(authMiddleware);

// POST /api/dev/trigger-reminder
router.post('/trigger-reminder', triggerDueDateReminder);

module.exports = router;
