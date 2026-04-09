const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load biến môi trường
dotenv.config();

// Kết nối MongoDB
connectDB();

const app = express();

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (cho phép Android nối thêm base URL để load ảnh)
app.use('/uploads', express.static('uploads'));

// ==================== ROUTES ====================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/tasks', require('./routes/task'));
app.use('/api/conversations', require('./routes/conversation'));
app.use('/api/messages', require('./routes/message'));

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Task Manager API is running!',
  });
});

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
  });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);

  let statusCode = 500;
  let message = 'Internal server error.';

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format.';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value. This resource already exists.';
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
});

// ==================== START SERVER ====================
const http = require('http');
const { Server } = require('socket.io');
const socketHandler = require('./socket/index');

const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

socketHandler(io);

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Lắng nghe trên mọi interface mạng

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running locally on http://localhost:${PORT}`);
  
  // In ra IP mạng LAN để dễ copy vào app Android
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Bỏ qua các địa chỉ nội bộ (localhost/127.0.0.1) và IPv6
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`📱 Access from Android/LAN on http://${net.address}:${PORT}`);
      }
    }
  }
});
