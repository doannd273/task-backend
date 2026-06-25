require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

const DEFAULT_MESSAGE_COUNT = 30;

const samples = [
  'Chào, mình test luồng chat nhé.',
  'API getMessages đang cần nhiều data để kiểm tra pagination.',
  'Message này dùng để test hiển thị trên mobile.',
  'Có vẻ sort mới nhất trước đang hoạt động đúng.',
  'Thử thêm nội dung dài hơn một chút để kiểm tra wrap text trong UI chat bubble.',
  'Tin nhắn seed tự động từ backend local.',
  'Kiểm tra trạng thái conversation sau khi có lastMessage.',
  'Đây là message dùng cho demo.',
  'Nếu thấy dòng này trong app thì API đọc DB ổn.',
  'Test load thêm trang tiếp theo.',
];

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const seedMessages = async () => {
  const conversationId = process.argv[2] || process.env.CONVERSATION_ID;
  const messageCount = parsePositiveInteger(
    process.argv[3] || process.env.MESSAGE_SEED_COUNT,
    DEFAULT_MESSAGE_COUNT
  );

  if (!conversationId) {
    console.error('Usage: node seedMessages.js <conversationId> [count]');
    process.exit(1);
  }

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    console.error('Invalid conversationId. Expected a MongoDB ObjectId.');
    process.exit(1);
  }

  await connectDB();

  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      console.error(`Conversation not found: ${conversationId}`);
      process.exit(1);
    }

    const participants = conversation.participants || [];
    if (participants.length === 0) {
      console.error('Conversation has no participants, cannot assign senderId.');
      process.exit(1);
    }

    const now = Date.now();
    const messagesToInsert = [];

    for (let i = 0; i < messageCount; i++) {
      const index = i + 1;
      const createdAt = new Date(now - (messageCount - index) * 60 * 1000);
      const senderId = participants[i % participants.length];

      messagesToInsert.push({
        conversationId: conversation._id,
        senderId,
        content: `[seed ${index}/${messageCount}] ${samples[i % samples.length]}`,
        type: 'text',
        createdAt,
        updatedAt: createdAt,
      });
    }

    const insertedMessages = await Message.insertMany(messagesToInsert);
    const latestMessage = insertedMessages[insertedMessages.length - 1];

    conversation.lastMessage = {
      _id: latestMessage._id,
      content: latestMessage.content,
      senderId: latestMessage.senderId,
      createdAt: latestMessage.createdAt,
      type: latestMessage.type,
    };
    conversation.lastMessageAt = latestMessage.createdAt;
    await conversation.save();

    console.log(`Inserted ${insertedMessages.length} messages into conversation ${conversation._id}.`);
    console.log(`Latest message: ${latestMessage.content}`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed messages:', error);
    process.exit(1);
  }
};

seedMessages();
