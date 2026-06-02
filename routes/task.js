const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskStats,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');

// Tất cả routes đều cần xác thực
router.use(authMiddleware);

// GET    /api/tasks/getTasks           → Lấy danh sách task
router.get('/getTasks', getTasks);

// GET    /api/tasks/getTaskStats       → Thống kê task
router.get('/getTaskStats', getTaskStats);

// GET    /api/tasks/getTaskById/:id    → Lấy chi tiết task
router.get('/getTaskById/:id', getTaskById);

// POST   /api/tasks/createTask         → Tạo task mới
router.post('/createTask', createTask);

// PUT    /api/tasks/updateTask/:id     → Cập nhật task
router.put('/updateTask/:id', updateTask);

// DELETE /api/tasks/deleteTask/:id     → Xóa task
router.delete('/deleteTask/:id', deleteTask);

module.exports = router;
