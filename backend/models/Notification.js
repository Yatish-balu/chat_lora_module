const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['new_message', 'lora_message', 'system', 'mention'],
      default: 'new_message',
    },
    // Reference to the message that triggered this notification
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    // Reference to the chat
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      default: null,
    },
    // The user who triggered the notification (e.g. message sender)
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Short preview text for push notifications
    preview: {
      type: String,
      default: '',
      maxlength: 100,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    // For LoRa mode — extra metadata
    loraRssi: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/* ─── Mark all notifications as read for a user ─── */
notificationSchema.statics.markAllRead = async function (userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true } }
  );
};

/* ─── Get unread count for a user ─── */
notificationSchema.statics.unreadCount = async function (userId) {
  return this.countDocuments({ user: userId, isRead: false });
};

module.exports = mongoose.model('Notification', notificationSchema);
