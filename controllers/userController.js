const User = require('../models/User');
const { sendError } = require('../utils/response');
const { toAbsoluteUrl } = require('../utils/url');
const { formatUserResponse, formatUsersResponse } = require('../utils/userResponse');
const {
  isAllowedUploadedImage,
  removeUploadedFile,
} = require('../middleware/uploadMiddleware');

const isAllowedAvatarPath = (value) => (
  value === '' ||
  /^\/uploads\/avatars\/[^/]+\.(jpg|jpeg|png|webp)$/i.test(String(value || '').trim())
);

// ==================== GET PROFILE ====================
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(req, res, 404, 'USER_NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: formatUserResponse(req, user),
    });
  } catch (error) {
    console.error('Get profile error:', error.message);
    return sendError(req, res, 500, 'USER_PROFILE_RETRIEVE_FAILED');
  }
};

// ==================== UPDATE PROFILE ====================
// Only allows updating: avatar, phone
// Does NOT allow: email, password
const updateProfile = async (req, res) => {
  try {
    const { avatar, phone, fullName } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(req, res, 404, 'USER_NOT_FOUND');
    }

    // Only update allowed fields
    if (avatar !== undefined) {
      if (!isAllowedAvatarPath(avatar)) {
        return sendError(req, res, 400, 'USER_AVATAR_INVALID_URL');
      }

      user.avatar = avatar;
    }
    if (phone !== undefined) user.phone = phone;
    if (fullName !== undefined) user.fullName = fullName;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: formatUserResponse(req, user),
    });
  } catch (error) {
    console.error('Update profile error:', error.message);

    // Mongoose validation error (e.g. invalid phone format)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return sendError(req, res, 400, 'COMMON_VALIDATION_ERROR', {}, {
        details: messages,
      });
    }

    return sendError(req, res, 500, 'USER_PROFILE_UPDATE_FAILED');
  }
};

// ==================== CHANGE PASSWORD ====================
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return sendError(req, res, 400, 'USER_PASSWORD_REQUIRED');
    }

    if (newPassword.length < 6) {
      return sendError(req, res, 400, 'USER_PASSWORD_TOO_SHORT');
    }

    // Find user (need password field for comparison)
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(req, res, 404, 'USER_NOT_FOUND');
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return sendError(req, res, 401, 'USER_CURRENT_PASSWORD_INCORRECT');
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        message: 'Password changed successfully.',
      },
    });
  } catch (error) {
    console.error('Change password error:', error.message);
    return sendError(req, res, 500, 'USER_PASSWORD_CHANGE_FAILED');
  }
};

// ==================== UPLOAD AVATAR ====================
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(req, res, 400, 'USER_AVATAR_FILE_REQUIRED');
    }

    if (!(await isAllowedUploadedImage(req.file))) {
      await removeUploadedFile(req.file.path);
      return sendError(req, res, 400, 'USER_AVATAR_INVALID_FILE_TYPE');
    }

    // path of uploaded file, accessible via the static URL we configured in server.js
    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(req, res, 404, 'USER_NOT_FOUND');
    }

    user.avatar = avatarPath;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        avatar: toAbsoluteUrl(req, avatarPath),
        avatarPath,
        message: 'Avatar uploaded successfully.',
      },
    });
  } catch (error) {
    console.error('Upload avatar error:', error.message);
    return sendError(req, res, 500, 'USER_AVATAR_UPLOAD_FAILED');
  }
};

// ==================== SEARCH USERS ====================
const searchUsers = async (req, res) => {
  try {
    const { keyword, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.max(parseInt(limit), 1);
    const skip = (pageNum - 1) * limitNum;

    // Must have a keyword to search, otherwise return empty
    if (!keyword || !keyword.trim()) {
      return res.status(200).json({
        success: true,
        data: { users: [], totalItems: 0 },
      });
    }

    const searchRegex = new RegExp(keyword.trim(), 'i');

    const filter = {
      _id: { $ne: req.user._id }, // exclude current user
      $or: [
        { email: searchRegex },
        { fullName: searchRegex },
      ],
    };

    const totalItems = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('_id fullName email avatar phone createdAt')
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: {
        users: formatUsersResponse(req, users),
        totalItems,
        totalPages: Math.ceil(totalItems / limitNum),
        currentPage: pageNum,
      },
    });
  } catch (error) {
    console.error('Search users error:', error.message);
    return sendError(req, res, 500, 'USER_SEARCH_FAILED');
  }
};

module.exports = { getProfile, updateProfile, changePassword, uploadAvatar, searchUsers };
