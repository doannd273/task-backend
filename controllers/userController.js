const User = require('../models/User');

// ==================== GET PROFILE ====================
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile.',
    });
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
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Only update allowed fields
    if (avatar !== undefined) user.avatar = avatar;
    if (phone !== undefined) user.phone = phone;
    if (fullName !== undefined) user.fullName = fullName;

    await user.save();

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Update profile error:', error.message);

    // Mongoose validation error (e.g. invalid phone format)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
    });
  }
};

// ==================== CHANGE PASSWORD ====================
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
    }

    // Find user (need password field for comparison)
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
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
    res.status(500).json({
      success: false,
      message: 'Failed to change password.',
    });
  }
};

// ==================== UPLOAD AVATAR ====================
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided.',
      });
    }

    // path of uploaded file, accessible via the static URL we configured in server.js
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    user.avatar = avatarUrl;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        avatar: avatarUrl,
        message: 'Avatar uploaded successfully.',
      },
    });
  } catch (error) {
    console.error('Upload avatar error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar.',
    });
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
        users,
        totalItems,
        totalPages: Math.ceil(totalItems / limitNum),
        currentPage: pageNum,
      },
    });
  } catch (error) {
    console.error('Search users error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to search users.',
    });
  }
};

module.exports = { getProfile, updateProfile, changePassword, uploadAvatar, searchUsers };
