const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // Never return password in queries
    },
    avatar: {
      type: String,
      default: '', // URL or base64 string
    },
    status: {
      type: String,
      enum: ['online', 'away', 'offline'],
      default: 'offline',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    socketId: {
      type: String,
      default: null,
    },
    // User bio / display name
    displayName: {
      type: String,
      default: '',
      maxlength: 50,
    },
    // Preferred communication mode
    preferredMode: {
      type: String,
      enum: ['online', 'lora', 'hybrid'],
      default: 'online',
    },
  },
  {
    timestamps: true,
  }
);

/* ─── Virtual: public profile (no password) ─── */
userSchema.virtual('publicProfile').get(function () {
  return {
    _id: this._id,
    username: this.username,
    email: this.email,
    avatar: this.avatar,
    status: this.status,
    lastSeen: this.lastSeen,
    displayName: this.displayName || this.username,
    createdAt: this.createdAt,
  };
});

/* ─── Hash password before saving ─── */
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

/* ─── Compare plain password with stored hash ─── */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/* ─── Update status + lastSeen helper ─── */
userSchema.methods.setStatus = async function (status) {
  this.status = status;
  if (status === 'offline') {
    this.lastSeen = new Date();
    this.socketId = null;
  }
  return this.save({ validateBeforeSave: false });
};

const UserModel = mongoose.model('User', userSchema);
const wrapModel = require('../services/DbWrapper');
module.exports = wrapModel('User', UserModel);
