const mongoose = require('mongoose');
const { MESSAGE_TYPES, DEFAULT_MESSAGE_TYPE } = require('../utils/messageTypes');

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['private', 'group'],
      required: true,
    },
    name: {
      type: String,
      trim: true,
      default: '', // Dùng cho 'group', 'private' ko cần
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    lastMessage: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
      },
      content: String,
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      createdAt: Date,
      type: {
        type: String,
        enum: MESSAGE_TYPES,
        default: DEFAULT_MESSAGE_TYPE,
      },
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index để tìm kiếm conversation nhanh cho 1 user
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
