const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    // Supports future group chats
    chatType: {
      type: String,
      enum: ['direct', 'group'],
      default: 'direct',
    },

    // For direct chats: exactly 2 users. For groups: N users.
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],

    // Group-only fields (populated when chatType === 'group')
    groupName: {
      type: String,
      default: '',
    },
    groupAvatar: {
      type: String,
      default: '',
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Snapshot of the last message for sidebar preview
    lastMessage: {
      content: { type: String, default: '' },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      timestamp: { type: Date, default: Date.now },
      mode: { type: String, enum: ['online', 'lora', 'hybrid'], default: 'online' },
    },

    // Per-participant unread counts
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

/* ─── Ensure only one direct chat between two users ─── */
chatSchema.index(
  { participants: 1, chatType: 1 },
  { unique: false } // uniqueness enforced at application layer for flexibility
);

/* ─── Static: find or create direct chat between two users ─── */
chatSchema.statics.findOrCreateDirect = async function (userIdA, userIdB) {
  // Sort IDs so order doesn't matter
  const ids = [userIdA, userIdB].map(String).sort();

  let chat = await this.findOne({
    chatType: 'direct',
    participants: { $all: ids, $size: 2 },
  }).populate('participants', '-passwordHash');

  if (!chat) {
    chat = await this.create({
      chatType: 'direct',
      participants: ids,
      unreadCounts: { [ids[0]]: 0, [ids[1]]: 0 },
    });
    chat = await chat.populate('participants', '-passwordHash');
  }

  return chat;
};

/* ─── Instance: increment unread count for a user ─── */
chatSchema.methods.incrementUnread = async function (userId) {
  const key = String(userId);
  const current = this.unreadCounts.get(key) || 0;
  this.unreadCounts.set(key, current + 1);
  return this.save({ validateBeforeSave: false });
};

/* ─── Instance: reset unread count for a user ─── */
chatSchema.methods.resetUnread = async function (userId) {
  const key = String(userId);
  this.unreadCounts.set(key, 0);
  return this.save({ validateBeforeSave: false });
};

const ChatModel = mongoose.model('Chat', chatSchema);
const wrapModel = require('../services/DbWrapper');
module.exports = wrapModel('Chat', ChatModel);
