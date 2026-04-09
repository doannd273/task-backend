const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// GET  /api/messages/getMessages/:conversationId
router.get('/getMessages/:conversationId', getMessages);

// POST /api/messages/sendMessage
router.post('/sendMessage', sendMessage);

module.exports = router;
