const express = require('express');
const router = express.Router();
const {
  createConversation,
  getConversations,
  getConversationDetails,
  updateConversation,
  deleteConversation,
  addParticipant,
  removeParticipant,
  getParticipants
} = require('../controllers/conversationController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// POST   /api/conversations/createConversation
router.post('/createConversation', createConversation);

// GET    /api/conversations/getConversations
router.get('/getConversations', getConversations);

// GET    /api/conversations/getConversationDetails/:id
router.get('/getConversationDetails/:id', getConversationDetails);

// PUT    /api/conversations/updateConversation/:id
router.put('/updateConversation/:id', updateConversation);

// DELETE /api/conversations/deleteConversation/:id
router.delete('/deleteConversation/:id', deleteConversation);

// POST   /api/conversations/addParticipant/:id
router.post('/addParticipant/:id', addParticipant);

// DELETE /api/conversations/removeParticipant/:id/:userId
router.delete('/removeParticipant/:id/:userId', removeParticipant);

// GET    /api/conversations/getParticipants/:id
router.get('/getParticipants/:id', getParticipants);

module.exports = router;
