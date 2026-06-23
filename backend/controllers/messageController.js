const Message = require('../models/Message');
const Chat = require('../models/Chat');
const Notification = require('../models/Notification');
const { AppError } = require('../middleware/error');
const { v4: uuidv4 } = require('uuid');

/**
 * @desc   Get all messages for a chat (paginated)
 * @route  GET /api/messages/:chatId
 * @access Private
 */
const getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify user is part of this chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id,
    });

    if (!chat) {
      return next(new AppError('Chat not found or access denied', 404));
    }

    const messages = await Message.find({
      chat: chatId,
      deletedFor: { $ne: req.user._id },
    })
      .populate('sender', 'username avatar displayName')
      .populate('receiver', 'username avatar displayName')
      .populate('replyTo', 'content sender')
      .sort({ createdAt: -1 }) // newest first for pagination
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({
      chat: chatId,
      deletedFor: { $ne: req.user._id },
    });

    // Return in chronological order for display
    res.status(200).json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + messages.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Send a new message
 * @route  POST /api/messages/send
 * @body   { chatId, receiverId, content, mode, replyTo, clientId }
 * @access Private
 */
const sendMessage = async (req, res, next) => {
  try {
    const { chatId, receiverId, content, mode = 'online', replyTo, clientId } = req.body;

    if (!chatId || !receiverId || !content) {
      return next(new AppError('chatId, receiverId, and content are required', 400));
    }

    // Prevent duplicates using clientId
    if (clientId) {
      const existing = await Message.findOne({ clientId });
      if (existing) {
        return res.status(200).json({ success: true, message: existing, duplicate: true });
      }
    }

    // Verify chat access
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id,
    });

    if (!chat) {
      return next(new AppError('Chat not found or access denied', 404));
    }

    const isLoRaMode = mode === 'lora' || mode === 'hybrid';
    let loraMsgId = null;

    if (isLoRaMode) {
      loraMsgId = String(Math.floor(1000 + Math.random() * 9000));
      let attempts = 0;
      while (attempts < 10) {
        const exists = await Message.findOne({
          'loraMetadata.msgId': loraMsgId,
          status: { $in: ['queued', 'sent'] }
        });
        if (!exists) break;
        loraMsgId = String(Math.floor(1000 + Math.random() * 9000));
        attempts++;
      }
    }

    // Create message
    const message = await Message.create({
      chat: chatId,
      sender: req.user._id,
      receiver: receiverId,
      content,
      mode,
      status: isLoRaMode ? 'sent' : 'sent',
      sentAt: new Date(),
      replyTo: replyTo || null,
      clientId: clientId || uuidv4(),
      loraMetadata: isLoRaMode ? {
        msgId: loraMsgId,
        ackReceived: false,
        rssi: null
      } : undefined
    });

    // Update chat's lastMessage snapshot
    await Chat.findByIdAndUpdate(chatId, {
      $set: {
        'lastMessage.content': content,
        'lastMessage.sender': req.user._id,
        'lastMessage.timestamp': new Date(),
        'lastMessage.mode': mode,
      },
    });

    // Increment unread count for the receiver
    await chat.incrementUnread(receiverId);

    // Create notification for receiver
    await Notification.create({
      user: receiverId,
      type: mode === 'lora' ? 'lora_message' : 'new_message',
      message: message._id,
      chat: chatId,
      triggeredBy: req.user._id,
      preview: content.substring(0, 100),
    });

    // Populate for response
    const populated = await message.populate([
      { path: 'sender', select: 'username avatar displayName' },
      { path: 'receiver', select: 'username avatar displayName' },
    ]);

    // If LoRa mode is active, transmit via LoRa module
    if (isLoRaMode) {
      try {
        const User = require('../models/User');
        const receiverUser = await User.findById(receiverId);
        if (receiverUser) {
          const LoRaService = require('../services/LoRaService');
          const success = LoRaService.sendLoRaMessage({
            msgId: loraMsgId,
            sender: req.user.username,
            receiver: receiverUser.username,
            content: content.trim()
          });
          if (success) {
            console.log(`[LoRa] Successfully sent message over serial (HTTP): msgId=${loraMsgId} to ${receiverUser.username}`);
          } else {
            console.warn(`[LoRa] Serial port not open or sending failed for msgId=${loraMsgId}`);
          }
        }
      } catch (err) {
        console.error('[LoRa] Transmission error:', err.message);
      }
    }

    res.status(201).json({
      success: true,
      message: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Mark messages as read in a chat
 * @route  POST /api/messages/read
 * @body   { chatId }
 * @access Private
 */
const markMessagesRead = async (req, res, next) => {
  try {
    const { chatId } = req.body;

    if (!chatId) {
      return next(new AppError('chatId is required', 400));
    }

    await Message.markRead(chatId, req.user._id);

    // Reset unread count in chat
    const chat = await Chat.findById(chatId);
    if (chat) {
      await chat.resetUnread(req.user._id);
    }

    // Mark notifications as read
    await Notification.markAllRead(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Mark messages as delivered
 * @route  POST /api/messages/delivered
 * @body   { chatId }
 * @access Private
 */
const markMessagesDelivered = async (req, res, next) => {
  try {
    const { chatId } = req.body;

    if (!chatId) {
      return next(new AppError('chatId is required', 400));
    }

    await Message.markDelivered(chatId, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Messages marked as delivered',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Delete a message (soft delete for self)
 * @route  DELETE /api/messages/:messageId
 * @access Private
 */
const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findOne({
      _id: req.params.messageId,
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    });

    if (!message) {
      return next(new AppError('Message not found', 404));
    }

    // Add user to deletedFor array
    if (!message.deletedFor.includes(req.user._id)) {
      message.deletedFor.push(req.user._id);
      await message.save();
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  sendMessage,
  markMessagesRead,
  markMessagesDelivered,
  deleteMessage,
};
