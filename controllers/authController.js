const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/response');

// Tạo Access Token (ngắn hạn)
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });
};

// Tạo Refresh Token (dài hạn)
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });
};

// ==================== REGISTER ====================
const register = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Validate input
    if (!email || !password || !fullName) {
      return sendError(req, res, 400, 'AUTH_REGISTER_REQUIRED_FIELDS');
    }

    // Check email đã tồn tại chưa
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(req, res, 409, 'AUTH_EMAIL_ALREADY_REGISTERED');
    }

    // Tạo user mới
    const user = await User.create({ email, password, fullName });

    // Tạo tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Lưu refresh token vào DB
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      data: {
        userId: user._id,
        accessToken,
        refreshToken,
        user: {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          avatar: user.avatar || '',
        },
      },
    });
  } catch (error) {
    console.error('Register error:', error.message);
    
    // Mongoose validation error (ví dụ: password < 6 kí tự, thiếu trường bắt buộc...)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return sendError(req, res, 400, 'COMMON_VALIDATION_ERROR', {}, {
        details: messages,
      });
    }

    return sendError(req, res, 500, 'AUTH_REGISTRATION_FAILED');
  }
};

// ==================== LOGIN ====================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return sendError(req, res, 400, 'AUTH_LOGIN_REQUIRED_FIELDS');
    }

    // Tìm user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return sendError(req, res, 401, 'AUTH_INVALID_CREDENTIALS');
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(req, res, 401, 'AUTH_INVALID_CREDENTIALS');
    }

    // Tạo tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Lưu refresh token vào DB
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          avatar: user.avatar || '',
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return sendError(req, res, 500, 'AUTH_LOGIN_FAILED');
  }
};

// ==================== REFRESH TOKEN ====================
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return sendError(req, res, 400, 'AUTH_REFRESH_TOKEN_REQUIRED');
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return sendError(req, res, 401, 'AUTH_INVALID_OR_EXPIRED_REFRESH_TOKEN');
    }

    // Tìm user và kiểm tra refresh token khớp
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== token) {
      return sendError(req, res, 401, 'AUTH_INVALID_REFRESH_TOKEN');
    }

    // Tạo access token mới
    const newAccessToken = generateAccessToken(user._id);

    // (Tuỳ chọn) Rotate refresh token: tạo refresh token mới luôn
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error.message);
    return sendError(req, res, 500, 'AUTH_REFRESH_FAILED');
  }
};

// ==================== LOGOUT ====================
const logout = async (req, res) => {
  try {
    // Xóa refresh token khỏi DB
    const user = req.user;
    user.refreshToken = null;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully.',
      },
    });
  } catch (error) {
    console.error('Logout error:', error.message);
    return sendError(req, res, 500, 'AUTH_LOGOUT_FAILED');
  }
};

// ==================== FORGOT PASSWORD ====================
const nodemailer = require('nodemailer');

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(req, res, 400, 'AUTH_EMAIL_REQUIRED');
    }

    // Tìm user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Dùng thông báo chung để tránh expose email hợp lệ hay không
      return sendError(req, res, 404, 'AUTH_ACCOUNT_EMAIL_NOT_FOUND');
    }

    // Generate a random new password (8 characters)
    const newPassword = Math.random().toString(36).slice(-8);

    // Gán password mới (Hook pre-save trong User model sẽ tự động mã hóa nó)
    user.password = newPassword;
    await user.save();

    // Gửi email chứa password mới
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Bạn có thể cấu hình service khác tùy ý
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Reset Password - Task Manager API',
      text: `Chào bạn,\n\nMật khẩu của bạn đã được đặt lại thành công.\n\nMật khẩu mới của bạn là: ${newPassword}\n\nVui lòng đăng nhập và đổi mật khẩu mới sớm nhất có thể để đảm bảo an toàn.\n\nTrân trọng!`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      data: {
        message: 'A new password has been sent to your email.',
      },
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    return sendError(req, res, 500, 'AUTH_FORGOT_PASSWORD_FAILED');
  }
};

module.exports = { register, login, refreshToken, logout, forgotPassword };
