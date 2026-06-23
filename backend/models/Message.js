const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    // Communication mode used to send this message
    mode: {
      type: String,
      enum: ['online', 'lora', 'hybrid'],
      default: 'online',
    },
    // WhatsApp-style delivery status
    status: {
      type: String,
      enum: ['pending', 'queued', 'sent', 'delivered', 'read', 'failed'],
      default: 'pending',
    },
    // LoRa-specific fields
    loraMetadata: {
      rssi: { type: Number, default: null },          // Signal strength in dBm
      msgId: { type: String, default: null },          // LoRa packet ID
      ackReceived: { type: Boolean, default: false },  // ACK confirmation
      retries: { type: Number, default: 0 },           // Transmission attempts
    },
    // Reply threading
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    // Soft delete (deleted for self only)
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Client-generated ID to prevent duplicates
    clientId: {
      type: String,
      default: null,
      index: true,
    },
    // Timestamps
    sentAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
  },
  {
    timestamps: true, // createdAt = when saved to DB
  }
);

/* ─── Indexes for performance ─── */
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ status: 1 });

/* ─── Static: bulk mark messages as delivered ─── */
messageSchema.statics.markDelivered = async function (chatId, receiverId) {
  const now = new Date();
  return this.updateMany(
    {
      chat: chatId,
      receiver: receiverId,
      status: { $in: ['sent', 'queued'] },
    },
    {
      $set: { status: 'delivered', deliveredAt: now },
    }
  );
};

/* ─── Static: bulk mark messages as read ─── */
messageSchema.statics.markRead = async function (chatId, readerId) {
  const now = new Date();
  return this.updateMany(
    {
      chat: chatId,
      receiver: readerId,
      status: { $in: ['sent', 'delivered', 'queued'] },
    },
    {
      $set: { status: 'read', readAt: now },
    }
  );
};

const MessageModel = mongoose.model('Message', messageSchema);
const wrapModel = require('../services/DbWrapper');
module.exports = wrapModel('Message', MessageModel);
