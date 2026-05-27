const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { sendError } = require('../utils/response');
const { translate } = require('../utils/i18n');
const { toAbsoluteUrl } = require('../utils/url');
const { bumpAuthVersion, getAuthVersion, isAuthVersionValid } = require('../utils/authVersion');

const PASSWORD_RESET_OTP_TTL_MS = 5 * 60 * 1000;
const PASSWORD_RESET_MAX_ATTEMPTS = 5;
const PASSWORD_RESET_OTP_DELIVERY_CONSOLE = 'console';

// Tạo Access Token (ngắn hạn)
const generateAccessToken = (user) => {
  return jwt.sign({ userId: user._id, authVersion: getAuthVersion(user) }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });
};

// Tạo Refresh Token (dài hạn)
const generateRefreshToken = (user) => {
  return jwt.sign({ userId: user._id, authVersion: getAuthVersion(user) }, process.env.JWT_REFRESH_SECRET, {
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
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Lưu refresh token vào DB
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      code: 'AUTH_REGISTER_SUCCESS',
      message: translate(req.locale, 'AUTH_REGISTER_SUCCESS'),
      data: {
        userId: user._id,
        accessToken,
        refreshToken,
        user: {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          avatar: toAbsoluteUrl(req, user.avatar),
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
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return sendError(req, res, 401, 'AUTH_INVALID_CREDENTIALS');
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(req, res, 401, 'AUTH_INVALID_CREDENTIALS');
    }

    // Tạo tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

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
          avatar: toAbsoluteUrl(req, user.avatar),
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
    if (!user || user.refreshToken !== token || !isAuthVersionValid(decoded, user)) {
      return sendError(req, res, 401, 'AUTH_INVALID_REFRESH_TOKEN');
    }

    // Tạo access token mới
    const newAccessToken = generateAccessToken(user);

    // (Tuỳ chọn) Rotate refresh token: tạo refresh token mới luôn
    const newRefreshToken = generateRefreshToken(user);
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

const isConsoleOtpDelivery = () => {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.PASSWORD_RESET_OTP_DELIVERY === PASSWORD_RESET_OTP_DELIVERY_CONSOLE
  );
};

const isEmailServiceConfigured = () => {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
};

const maskEmail = (email) => {
  const [name, domain] = String(email).split('@');
  if (!name || !domain) return 'unknown';

  const visibleName = name.length <= 2 ? name[0] : `${name[0]}***${name[name.length - 1]}`;
  return `${visibleName}@${domain}`;
};

const sendPasswordResetOtpEmail = async (email, otp, req) => {
  if (isConsoleOtpDelivery()) {
    console.warn('Password reset OTP dev delivery:', {
      requestId: req.requestId,
      email: maskEmail(email),
      otp,
    });
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset Password OTP - Task Manager API',
    text: `Xin chào,\n\nMã đặt lại mật khẩu của bạn là: ${otp}\n\nMã này có hiệu lực trong 5 phút. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.\n\nTrân trọng!`,
  });
};

const clearPasswordResetOtp = (user) => {
  user.passwordResetOtpHash = null;
  user.passwordResetExpires = null;
  user.passwordResetAttempts = 0;
};

const sendPasswordResetRequested = (req, res) => {
  const message = translate(req.locale, 'AUTH_PASSWORD_RESET_OTP_SENT');

  return res.status(200).json({
    success: true,
    code: 'AUTH_PASSWORD_RESET_OTP_SENT',
    message,
  });
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(req, res, 400, 'AUTH_EMAIL_REQUIRED');
    }

    if (!isConsoleOtpDelivery() && !isEmailServiceConfigured()) {
      console.error('Forgot password email config missing:', {
        requestId: req.requestId,
        hasEmailUser: Boolean(process.env.EMAIL_USER),
        hasEmailPass: Boolean(process.env.EMAIL_PASS),
      });
      return sendError(req, res, 500, 'AUTH_EMAIL_SERVICE_NOT_CONFIGURED');
    }

    // Tìm user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return sendPasswordResetRequested(req, res);
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    user.passwordResetOtpHash = await bcrypt.hash(otp, 10);
    user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_OTP_TTL_MS);
    user.passwordResetAttempts = 0;
    await user.save();

    try {
      await sendPasswordResetOtpEmail(user.email, otp, req);
    } catch (error) {
      clearPasswordResetOtp(user);
      await user.save();

      console.error('Forgot password email send error:', {
        requestId: req.requestId,
        code: error.code,
        command: error.command,
        responseCode: error.responseCode,
        message: error.message,
      });
      return sendError(req, res, 500, 'AUTH_EMAIL_SEND_FAILED');
    }

    return sendPasswordResetRequested(req, res);
  } catch (error) {
    console.error('Forgot password error:', {
      requestId: req.requestId,
      message: error.message,
    });
    return sendError(req, res, 500, 'AUTH_FORGOT_PASSWORD_FAILED');
  }
};

// ==================== RESET PASSWORD ====================
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return sendError(req, res, 400, 'AUTH_RESET_PASSWORD_REQUIRED_FIELDS');
    }

    if (newPassword.length < 6) {
      return sendError(req, res, 400, 'AUTH_NEW_PASSWORD_TOO_SHORT');
    }

    const normalizedOtp = String(otp).trim();
    if (!/^\d{6}$/.test(normalizedOtp)) {
      return sendError(req, res, 400, 'AUTH_RESET_PASSWORD_INVALID_OR_EXPIRED');
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.passwordResetOtpHash || !user.passwordResetExpires) {
      return sendError(req, res, 400, 'AUTH_RESET_PASSWORD_INVALID_OR_EXPIRED');
    }

    if (user.passwordResetAttempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
      return sendError(req, res, 429, 'AUTH_RESET_PASSWORD_TOO_MANY_ATTEMPTS');
    }

    if (user.passwordResetExpires.getTime() < Date.now()) {
      clearPasswordResetOtp(user);
      await user.save();
      return sendError(req, res, 400, 'AUTH_RESET_PASSWORD_INVALID_OR_EXPIRED');
    }

    const isMatch = await bcrypt.compare(normalizedOtp, user.passwordResetOtpHash);
    if (!isMatch) {
      user.passwordResetAttempts += 1;
      await user.save();

      if (user.passwordResetAttempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
        return sendError(req, res, 429, 'AUTH_RESET_PASSWORD_TOO_MANY_ATTEMPTS');
      }

      return sendError(req, res, 400, 'AUTH_RESET_PASSWORD_INVALID_OR_EXPIRED');
    }

    user.password = newPassword;
    user.refreshToken = null;
    bumpAuthVersion(user);
    clearPasswordResetOtp(user);
    await user.save();

    const message = translate(req.locale, 'AUTH_RESET_PASSWORD_SUCCESS');

    return res.status(200).json({
      success: true,
      code: 'AUTH_RESET_PASSWORD_SUCCESS',
      message,
    });
  } catch (error) {
    console.error('Reset password error:', {
      requestId: req.requestId,
      message: error.message,
    });
    return sendError(req, res, 500, 'AUTH_RESET_PASSWORD_FAILED');
  }
};

module.exports = { register, login, refreshToken, logout, forgotPassword, resetPassword };
