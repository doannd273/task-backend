const jwt = require('jsonwebtoken');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const socketHandler = (io) => {
  // Middleware xác thực token WebSocket
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.userId} (socket_id: ${socket.id})`);

    // Gán userId vào 1 room cá nhân để có thể gửi realtime notificaton 1-1
    socket.join(socket.userId);

    // ================== ROOM MANAGEMENT ==================
    socket.on('join_conversation', async ({ conversationId }) => {
      try {
        // Kiểm tra quyền (user có thuộc nhóm không)
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.userId
        });

        if (conversation) {
          socket.join(`conversation:${conversationId}`);
        }
      } catch (err) {
        console.error('Socket join_conversation error:', err);
      }
    });

    socket.on('leave_conversation', ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // ================== MESSAGING ==================
    socket.on('send_message', async ({ conversationId, content, type }, callback) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.userId
        });

        if (!conversation) {
          if (callback) callback({ success: false, message: 'Conversation not found or access denied' });
          return;
        }

        // Tạo message
        const message = await Message.create({
          conversationId,
          senderId: socket.userId,
          content,
          type: type || 'text'
        });

        // Cập nhật conversation
        conversation.lastMessage = {
          content,
          senderId: socket.userId,
          createdAt: message.createdAt,
          type: type || 'text'
        };
        conversation.lastMessageAt = message.createdAt;
        await conversation.save();

        // Broadcast tới các user đang trong room
        io.to(`conversation:${conversationId}`).emit('new_message', message);

        if (callback) callback({ success: true, data: message });
      } catch (error) {
        console.error('Socket send_message error:', error);
        if (callback) callback({ success: false, message: 'Server error' });
      }
    });

    // ================== TYPING INDICATORS ==================
    socket.on('typing_start', ({ conversationId }) => {
      // Bắn event cho những người khác trong room (trừ người gửi)
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: socket.userId,
        conversationId
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_stop_typing', {
        userId: socket.userId,
        conversationId
      });
    });

    // ================== DISCONNECT ==================
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.userId}`);
    });
  });
};

module.exports = socketHandler;
