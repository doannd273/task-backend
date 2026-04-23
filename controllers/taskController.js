const mongoose = require('mongoose');
const Task = require('../models/Task');

// Helper: validate MongoDB ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Valid statuses
const VALID_STATUSES = ['todo', 'in_progress', 'pending', 'done'];

// ==================== GET ALL TASKS (filter + search + pagination) ====================
const getTasks = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 20, 1);
    const skip = (page - 1) * limit;
    const { status, keyword } = req.query;

    // Build filter query
    const filter = { userId: req.user._id };

    // Filter by status
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        });
      }
      filter.status = status;
    }

    // Search by keyword (title or description)
    if (keyword && keyword.trim()) {
      const searchRegex = new RegExp(keyword.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
      ];
    }

    const totalItems = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: {
        tasks,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    console.error('Get tasks error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tasks.',
    });
  }
};

// ==================== GET TASK STATS ====================
const getTaskStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Count by each status
    const [total, todo, inProgress, pending, done] = await Promise.all([
      Task.countDocuments({ userId }),
      Task.countDocuments({ userId, status: 'todo' }),
      Task.countDocuments({ userId, status: 'in_progress' }),
      Task.countDocuments({ userId, status: 'pending' }),
      Task.countDocuments({ userId, status: 'done' }),
    ]);

    // Completion rate
    const completionRate = total > 0
      ? parseFloat(((done / total) * 100).toFixed(2))
      : 0;

    // Recent tasks (5 most recent)
    const recentTasks = await Task.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status dueDate createdAt');

    res.status(200).json({
      success: true,
      data: {
        total,
        todo,
        inProgress,
        pending,
        done,
        completionRate,
        recentTasks,
      },
    });
  } catch (error) {
    console.error('Get task stats error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve task statistics.',
    });
  }
};

// ==================== CREATE TASK ====================
const createTask = async (req, res) => {
  try {
    const { title, description, status, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required.',
      });
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const task = await Task.create({
      userId: req.user._id,
      title,
      description: description || '',
      status: status || 'todo',
      dueDate: dueDate || null,
    });

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Create task error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create task.',
    });
  }
};

// ==================== UPDATE TASK ====================
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, dueDate } = req.body;

    // Validate ObjectId format
    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format.',
      });
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    // Find task belonging to current user
    const task = await Task.findOne({ _id: id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    // Update only provided fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate === '' ? null : dueDate;

    await task.save();

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Update task error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update task.',
    });
  }
};

// ==================== DELETE TASK ====================
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format.',
      });
    }

    // Find and delete task belonging to current user
    const task = await Task.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'Task deleted successfully.',
      },
    });
  } catch (error) {
    console.error('Delete task error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task.',
    });
  }
};

module.exports = { getTasks, getTaskStats, createTask, updateTask, deleteTask };
