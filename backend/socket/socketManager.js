/**
 * socketManager.js
 * ─────────────────────────────────────────────────────────────
 * Manages all Socket.IO events for Chatter.
 *
 * Events handled:
 *   connection, disconnect
 *   user_online, user_offline
 *   typing, stop_typing
 *   send_message, receive_message
 *   message_sent, message_delivered, message_read
 *   join_chat, leave_chat
 *   lora_message (emitted by LoRaService)
 * ─────────────────────────────────────────────────────────────
 */

const User = require('../models/User');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const Notification = require('../models/Notification');
const { socketAuth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// In-memory map: userId → socketId (for quick lookup)
const onlineUsers = new Map();

const initSocketManager = (io) => {
  // Apply JWT auth middleware to all socket connections
  io.use(socketAuth);

  io.on('connection', async (socket) => {
    const user = socket.user;
    console.log(`[Socket] ✅ Connected: ${user.username} (${socket.id})`);

    // ─── Mark user online ───────────────────────────────────
    onlineUsers.set(String(user._id), socket.id);

    try {
      await User.findByIdAndUpdate(user._id, {
        $set: { status: 'online', socketId: socket.id },
      });

      // Notify all clients about new online user
      io.emit('user_online', {
        userId: user._id,
        username: user.username,
        avatar: user.avatar,
        status: 'online',
      });

      // Send the newly connected user the list of currently online users
      const onlineList = [];
      for (const [uid] of onlineUsers) {
        const u = await User.findById(uid).select('username avatar status _id displayName');
        if (u) onlineList.push(u);
      }
      socket.emit('online_users', onlineList);
    } catch (err) {
      console.error('[Socket] Error on connect:', err.message);
    }

    // ─── Join a chat room ────────────────────────────────────
    socket.on('join_chat', async ({ chatId }) => {
      if (!chatId) return;

      // Verify membership
      const chat = await Chat.findOne({ _id: chatId, participants: user._id });
      if (!chat) return;

      socket.join(chatId);
      console.log(`[Socket] ${user.username} joined room ${chatId}`);

      // Auto-mark messages as delivered when joining chat
      try {
        const result = await Message.markDelivered(chatId, user._id);
        if (result.modifiedCount > 0) {
          socket.to(chatId).emit('message_delivered', {
            chatId,
            receiverId: user._id,
          });
        }
      } catch (err) {
        console.error('[Socket] markDelivered error:', err.message);
      }
    });

    // ─── Leave a chat room ───────────────────────────────────
    socket.on('leave_chat', ({ chatId }) => {
      socket.leave(chatId);
    });

    // ─── Typing indicators ───────────────────────────────────
    socket.on('typing', ({ chatId, receiverId }) => {
      socket.to(chatId).emit('typing', {
        userId: user._id,
        username: user.username,
        chatId,
      });
    });

    socket.on('stop_typing', ({ chatId }) => {
      socket.to(chatId).emit('stop_typing', {
        userId: user._id,
        chatId,
      });
    });

    // ─── Send message via Socket.IO ──────────────────────────
    socket.on('send_message', async (data) => {
      try {
        const {
          chatId,
          receiverId,
          content,
          mode = 'online',
          replyTo = null,
          clientId,
        } = data;

        if (!chatId || !receiverId || !content?.trim()) return;

        // Dedup check
        const msgClientId = clientId || uuidv4();
        const existing = await Message.findOne({ clientId: msgClientId });
        if (existing) {
          socket.emit('message_sent', {
            clientId: msgClientId,
            message: existing,
            duplicate: true,
          });
          return;
        }

        // Verify chat membership
        const chat = await Chat.findOne({ _id: chatId, participants: user._id });
        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
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
          sender: user._id,
          receiver: receiverId,
          content: content.trim(),
          mode,
          status: isLoRaMode ? 'sent' : 'sent',
          sentAt: new Date(),
          replyTo,
          clientId: msgClientId,
          loraMetadata: isLoRaMode ? {
            msgId: loraMsgId,
            ackReceived: false,
            rssi: null
          } : undefined
        });

        // Update chat snapshot
        await Chat.findByIdAndUpdate(chatId, {
          $set: {
            'lastMessage.content': content.trim(),
            'lastMessage.sender': user._id,
            'lastMessage.timestamp': new Date(),
            'lastMessage.mode': mode,
          },
        });

        // Increment unread
        await chat.incrementUnread(receiverId);

        // Create notification
        await Notification.create({
          user: receiverId,
          type: mode === 'lora' ? 'lora_message' : 'new_message',
          message: message._id,
          chat: chatId,
          triggeredBy: user._id,
          preview: content.trim().substring(0, 100),
        });

        const populated = await message.populate([
          { path: 'sender', select: 'username avatar displayName status' },
          { path: 'receiver', select: 'username avatar displayName status' },
          { path: 'replyTo', select: 'content sender' },
        ]);

        // Confirm to sender
        socket.emit('message_sent', {
          clientId: msgClientId,
          message: populated,
        });

        // Deliver to receiver's chat room
        socket.to(chatId).emit('receive_message', populated);

        // If LoRa mode is active, transmit via LoRa module
        if (isLoRaMode) {
          try {
            const receiverUser = await User.findById(receiverId);
            if (receiverUser) {
              const LoRaService = require('../services/LoRaService');
              const success = LoRaService.sendLoRaMessage({
                msgId: loraMsgId,
                sender: user.username,
                receiver: receiverUser.username,
                content: content.trim()
              });
              if (success) {
                console.log(`[LoRa] Successfully sent message over serial: msgId=${loraMsgId} to ${receiverUser.username}`);
              } else {
                console.warn(`[LoRa] Serial port not open or sending failed for msgId=${loraMsgId}`);
              }
            }
          } catch (err) {
            console.error('[LoRa] Transmission error:', err.message);
          }
        }

        // Check if receiver is online — auto-deliver (for online mode only)
        if (!isLoRaMode) {
          const receiverSocketId = onlineUsers.get(String(receiverId));
          if (receiverSocketId) {
            // Receiver is online — mark as delivered immediately
            await Message.findByIdAndUpdate(message._id, {
              $set: { status: 'delivered', deliveredAt: new Date() },
            });

            socket.emit('message_delivered', {
              messageId: message._id,
              chatId,
              status: 'delivered',
            });
          }
        }
      } catch (err) {
        console.error('[Socket] send_message error:', err.message);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ─── Mark messages as read ───────────────────────────────
    socket.on('message_read', async ({ chatId, senderId }) => {
      try {
        if (!chatId) return;

        await Message.markRead(chatId, user._id);

        const chat = await Chat.findById(chatId);
        if (chat) await chat.resetUnread(user._id);

        // Notify the sender that messages have been read
        const senderSocketId = onlineUsers.get(String(senderId));
        if (senderSocketId) {
          io.to(senderSocketId).emit('message_read', {
            chatId,
            readerId: user._id,
            readerUsername: user.username,
          });
        }
      } catch (err) {
        console.error('[Socket] message_read error:', err.message);
      }
    });

    // ─── User goes away ──────────────────────────────────────
    socket.on('user_away', async () => {
      try {
        await User.findByIdAndUpdate(user._id, { $set: { status: 'away' } });
        io.emit('user_status_change', { userId: user._id, status: 'away' });
      } catch (err) {
        console.error('[Socket] user_away error:', err.message);
      }
    });

    // ─── Disconnect ──────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`[Socket] ❌ Disconnected: ${user.username} (${socket.id})`);

      onlineUsers.delete(String(user._id));

      try {
        await User.findByIdAndUpdate(user._id, {
          $set: { status: 'offline', lastSeen: new Date(), socketId: null },
        });

        io.emit('user_offline', {
          userId: user._id,
          username: user.username,
          lastSeen: new Date(),
          status: 'offline',
        });
      } catch (err) {
        console.error('[Socket] Disconnect cleanup error:', err.message);
      }
    });
  });

  console.log('[Socket] Socket.IO manager initialized');
};

module.exports = { initSocketManager, onlineUsers };
