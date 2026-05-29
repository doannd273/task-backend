const mongoose = require('mongoose');

const deviceTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: [true, 'Device token is required'],
      unique: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: {
        values: ['android', 'ios'],
        message: 'Platform must be: android or ios.',
      },
      default: 'android',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DeviceToken', deviceTokenSchema);
