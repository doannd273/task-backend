const mongoose = require('mongoose');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { sendError } = require('../utils/response');
const { formatUserResponse } = require('../utils/userResponse');
const { DEFAULT_MESSAGE_TYPE, isValidMessageType } = require('../utils/messageTypes');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const PUBLIC_USER_FIELDS = '_id email fullName avatar phone';

const formatMessageResponse = (req, message) => {
  const obj = typeof message.toJSON === 'function' ? message.toJSON() : message;

  if (Object.prototype.hasOwnProperty.call(obj, 'senderId')) {
    const sender = obj.senderId;
    obj.sender = sender && typeof sender === 'object' && sender._id
      ? formatUserResponse(req, sender)
      : null;
    delete obj.senderId;
  }

  return obj;
};

// ==================== GET MESSAGES ====================
// get messages for a conversation, paginated, sorted by createdAt backward (newest first, but usually clients reverse it to display)
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 20, 1);
    const skip = (page - 1) * limit;

    if (!isValidId(conversationId)) {
      return sendError(req, res, 400, 'MESSAGE_INVALID_CONVERSATION_ID');
    }

    // Verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return sendError(req, res, 404, 'MESSAGE_CONVERSATION_NOT_FOUND_OR_ACCESS_DENIED');
    }

    const totalItems = await Message.countDocuments({ conversationId });
    const messages = await Message.find({ conversationId })
      .populate('senderId', PUBLIC_USER_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: {
        messages: messages.map((message) => formatMessageResponse(req, message)),
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    console.error('Get messages error:', error.message);
    return sendError(req, res, 500, 'MESSAGE_RETRIEVE_FAILED');
  }
};

// ==================== SEND MESSAGE ====================
// REST api để gửi tin (tùy chọn backup cho Socket)
const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type } = req.body;
    const messageType = type || DEFAULT_MESSAGE_TYPE;

    if (!isValidId(conversationId)) return sendError(req, res, 400, 'MESSAGE_INVALID_CONVERSATION_ID');
    if (!content) return sendError(req, res, 400, 'MESSAGE_CONTENT_REQUIRED');
    if (!isValidMessageType(messageType)) return sendError(req, res, 400, 'MESSAGE_INVALID_TYPE');

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return sendError(req, res, 404, 'MESSAGE_CONVERSATION_NOT_FOUND_OR_ACCESS_DENIED');
    }

    const message = await Message.create({
      conversationId,
      senderId: req.user._id,
      content,
      type: messageType,
    });

    // Update conversation lastMessage
    conversation.lastMessage = {
      _id: message._id,
      content,
      senderId: req.user._id,
      createdAt: message.createdAt,
      type: messageType,
    };
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    await message.populate('senderId', PUBLIC_USER_FIELDS);

    res.status(201).json({ success: true, data: formatMessageResponse(req, message) });
  } catch (error) {
    console.error('Send message error:', error);
    return sendError(req, res, 500, 'MESSAGE_SEND_FAILED');
  }
};

module.exports = { getMessages, sendMessage };
