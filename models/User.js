const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    avatar: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
      match: [/^(\+?\d{9,15})?$/, 'Please provide a valid phone number'],
    },
    refreshToken: {
      type: String,
      default: null,
    },
    authVersion: {
      type: Number,
      default: 0,
      min: 0,
    },
    passwordResetOtpHash: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
    passwordResetAttempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // tự động tạo createdAt & updatedAt
  }
);

// Hash password trước khi save
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// So sánh password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Ẩn password & refreshToken khi trả JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.authVersion;
  delete obj.passwordResetOtpHash;
  delete obj.passwordResetExpires;
  delete obj.passwordResetAttempts;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
