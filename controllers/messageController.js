const mongoose = require('mongoose');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ==================== GET MESSAGES ====================
// get messages for a conversation, paginated, sorted by createdAt backward (newest first, but usually clients reverse it to display)
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 20, 1);
    const skip = (page - 1) * limit;

    if (!isValidId(conversationId)) {
      return res.status(400).json({ success: false, message: 'Invalid conversation ID' });
    }

    // Verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found or access denied' });
    }

    const totalItems = await Message.countDocuments({ conversationId });
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: {
        messages,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    console.error('Get messages error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve messages' });
  }
};

// ==================== SEND MESSAGE ====================
// REST api để gửi tin (tùy chọn backup cho Socket)
const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type } = req.body;

    if (!isValidId(conversationId)) return res.status(400).json({ success: false, message: 'Invalid conversation ID' });
    if (!content) return res.status(400).json({ success: false, message: 'Message content is required' });

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found or access denied' });
    }

    const message = await Message.create({
      conversationId,
      senderId: req.user._id,
      content,
      type: type || 'text',
    });

    // Update conversation lastMessage
    conversation.lastMessage = {
      content,
      senderId: req.user._id,
      createdAt: message.createdAt,
      type: type || 'text',
    };
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

module.exports = { getMessages, sendMessage };
