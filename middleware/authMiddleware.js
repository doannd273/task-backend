const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/response');

const authMiddleware = async (req, res, next) => {
  try {
    // Lấy token từ header Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(req, res, 401, 'AUTH_ACCESS_TOKEN_REQUIRED');
    }

    const token = authHeader.split(' ')[1];

    // Verify access token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm user trong DB
    const user = await User.findById(decoded.userId);
    if (!user) {
      return sendError(req, res, 401, 'AUTH_USER_NOT_FOUND');
    }

    // Gắn user vào request để controller sử dụng
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(req, res, 401, 'AUTH_TOKEN_EXPIRED');
    }
    return sendError(req, res, 401, 'AUTH_INVALID_TOKEN');
  }
};

module.exports = authMiddleware;
