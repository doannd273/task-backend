const mongoose = require('mongoose');
const { MESSAGE_TYPES, DEFAULT_MESSAGE_TYPE } = require('../utils/messageTypes');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: MESSAGE_TYPES,
      default: DEFAULT_MESSAGE_TYPE,
    },
  },
  {
    timestamps: true,
  }
);

// Index để lấy tin nhắn theo thứ tự thời gian nhanh hơn
messageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
