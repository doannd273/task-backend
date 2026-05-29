const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const localeMiddleware = require('./middleware/localeMiddleware');
const requestContextMiddleware = require('./middleware/requestContextMiddleware');
const { sendError } = require('./utils/response');
const { getLanIPv4Candidates, getPreferredLanIPv4 } = require('./utils/network');

// Load biến môi trường
dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Lắng nghe trên mọi interface mạng
const autoPublicBaseHost = process.env.DEV_BASE_API_HOST || getPreferredLanIPv4();

if (!process.env.PUBLIC_BASE_URL && process.env.NODE_ENV !== 'production' && autoPublicBaseHost) {
  process.env.PUBLIC_BASE_URL = `http://${autoPublicBaseHost}:${PORT}`;
}

// Kết nối MongoDB
connectDB();

// Cron jobs
const { scheduleDueDateReminder } = require('./jobs/dueDateReminderJob');
scheduleDueDateReminder();

const app = express();

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(localeMiddleware);
app.use(requestContextMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (cho phép Android nối thêm base URL để load ảnh)
app.use('/uploads', express.static('uploads'));

// ==================== ROUTES ====================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/devices', require('./routes/deviceRoutes'));
app.use('/api/tasks', require('./routes/task'));
app.use('/api/conversations', require('./routes/conversation'));
app.use('/api/messages', require('./routes/message'));

if (process.env.NODE_ENV !== 'production') {
  app.use('/api/dev', require('./routes/devRoutes'));
}

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Task Manager API is running!',
  });
});

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  return sendError(req, res, 404, 'COMMON_ROUTE_NOT_FOUND', {
    route: req.originalUrl,
  });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  console.error('❌ Error context:', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?._id?.toString?.(),
    client: req.client,
  });

  let statusCode = 500;
  let code = 'COMMON_INTERNAL_ERROR';
  let extra = {};

  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'COMMON_INVALID_ID';
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    code = 'COMMON_INVALID_JSON';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'COMMON_VALIDATION_ERROR';
    extra = {
      details: Object.values(err.errors).map((val) => val.message),
    };
  }

  if (err.code === 11000) {
    statusCode = 409;
    code = 'COMMON_DUPLICATE_RESOURCE';
  }

  if (err.code === 'UPLOAD_INVALID_FILE_TYPE') {
    statusCode = 400;
    code = 'USER_AVATAR_INVALID_FILE_TYPE';
  }

  if (err.name === 'MulterError') {
    statusCode = 400;

    if (err.code === 'LIMIT_FILE_SIZE') {
      code = 'USER_AVATAR_TOO_LARGE';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      code = 'USER_AVATAR_UNEXPECTED_FIELD';
    } else {
      code = 'USER_AVATAR_MULTIPART_INVALID';
    }
  }

  if (
    err.message === 'Multipart: Boundary not found' ||
    err.message === 'Unexpected end of form'
  ) {
    statusCode = 400;
    code = 'USER_AVATAR_MULTIPART_INVALID';
  }

  return sendError(req, res, statusCode, code, {}, extra);
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

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running locally on http://localhost:${PORT}`);
  console.log(`🌐 Public base URL: ${process.env.PUBLIC_BASE_URL || '(request host)'}`);

  // In ra IP mạng LAN để dễ copy vào app Android
  for (const candidate of getLanIPv4Candidates()) {
    console.log(`📱 Access from Android/LAN on http://${candidate.address}:${PORT}`);
  }
});
