const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title must be at most 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description must be at most 2000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['todo', 'in_progress', 'pending', 'done'],
        message: 'Status must be: todo, in_progress, pending, or done.',
      },
      default: 'todo',
      index: true,
    },
  },
  {
    timestamps: true, // tự động tạo createdAt & updatedAt
  }
);

module.exports = mongoose.model('Task', taskSchema);
