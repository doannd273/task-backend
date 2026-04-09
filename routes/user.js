const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  searchUsers,
} = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All routes require authentication
router.use(authMiddleware);

// GET    /api/user/getProfile          → Get current user profile
router.get('/getProfile', getProfile);

// PUT    /api/user/updateProfile       → Update avatar & phone
router.put('/updateProfile', updateProfile);

// PUT    /api/user/changePassword      → Change password
router.put('/changePassword', changePassword);

// POST   /api/user/uploadAvatar        → Upload avatar image
router.post('/uploadAvatar', upload.single('avatar'), uploadAvatar);

// GET    /api/user/searchUsers         → Search user by keyword (email)
router.get('/searchUsers', searchUsers);

module.exports = router;
