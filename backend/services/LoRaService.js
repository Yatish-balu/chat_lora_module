/**
 * LoRaService.js
 * ─────────────────────────────────────────────────────────────
 * Manages the SerialPort connection to the ESP32/STM32 LoRa node.
 *
 * Packet format (pipe-delimited, matches STM32 firmware):
 *   msgId|sender|receiver|mode|message|timestamp|RSSI\r\n
 *
 * Example:
 *   124|yatish|arun|lora|hello|1719123345|-75\r\n
 *
 * ACK packet format (sent back to acknowledge receipt):
 *   ACK|msgId|receiverUsername\r\n
 * ─────────────────────────────────────────────────────────────
 */

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const User = require('../models/User');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const Notification = require('../models/Notification');

class LoRaService {
  constructor() {
    this.port = null;
    this.parser = null;
    this.io = null;            // Socket.IO server instance (injected)
    this.isConnected = false;
    this.stats = {
      messagesReceived: 0,
      messagesSent: 0,
      errors: 0,
      lastActivity: null,
    };
    this.reconnectTimer = null;
    this.reconnectDelay = 5000; // 5 seconds
  }

  /**
   * Inject the Socket.IO server so LoRa messages can be pushed to clients
   */
  setSocketIO(io) {
    this.io = io;
  }

  /**
   * Connect to the serial port
   */
  async connect() {
    const portPath = process.env.LORA_PORT || 'COM3';
    const baudRate = parseInt(process.env.LORA_BAUD || '115200', 10);

    if (process.env.LORA_ENABLED !== 'true') {
      console.log('[LoRa] LoRa disabled via LORA_ENABLED env flag');
      return;
    }

    try {
      console.log(`[LoRa] Connecting to ${portPath} @ ${baudRate} baud...`);

      this.port = new SerialPort({
        path: portPath,
        baudRate,
        autoOpen: false,
      });

      this.parser = this.port.pipe(
        new ReadlineParser({ delimiter: '\r\n' })
      );

      // Event listeners
      this.port.on('open', () => {
        this.isConnected = true;
        console.log(`[LoRa] ✅ Connected to ${portPath}`);
        this._broadcastStatus();
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      });

      this.port.on('close', () => {
        this.isConnected = false;
        console.log('[LoRa] ⚠️  Port closed');
        this._broadcastStatus();
        this._scheduleReconnect();
      });

      this.port.on('error', (err) => {
        this.isConnected = false;
        this.stats.errors++;
        console.error('[LoRa] ❌ Port error:', err.message);
        this._broadcastStatus();
        this._scheduleReconnect();
      });

      // Listen for incoming data lines
      this.parser.on('data', (line) => this._handleIncomingLine(line));

      // Open the port
      this.port.open((err) => {
        if (err) {
          console.error(`[LoRa] Failed to open port: ${err.message}`);
          this.stats.errors++;
          this._scheduleReconnect();
        }
      });
    } catch (err) {
      console.error('[LoRa] Connection error:', err.message);
      this._scheduleReconnect();
    }
  }

  /**
   * Disconnect from serial port
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.port && this.port.isOpen) {
      this.port.close();
    }
    this.isConnected = false;
    console.log('[LoRa] Disconnected');
  }

  /**
   * Send a raw string over serial
   */
  sendRaw(data) {
    if (!this.isConnected || !this.port || !this.port.isOpen) {
      console.warn('[LoRa] Cannot send — port not open');
      return false;
    }
    console.log(`[LoRa] 📡 Sending: ${data}`);
    this.port.write(data + '\r\n', (err) => {
      if (err) {
        console.error('[LoRa] Write error:', err.message);
        this.stats.errors++;
      } else {
        this.stats.messagesSent++;
        this.stats.lastActivity = new Date();
      }
    });
    return true;
  }

  /**
   * Send a structured LoRa message over serial
   * Format: msgId|sender|receiver|mode|message|timestamp
   */
  sendLoRaMessage({ msgId, sender, receiver, content }) {
    const timestamp = Math.floor(Date.now() / 1000);
    const packet = `${msgId}|${sender}|${receiver}|lora|${content}|${timestamp}`;
    return this.sendRaw(packet);
  }

  /**
   * Send an ACK back to the sender
   * Format: ACK|msgId|receiverUsername
   */
  sendAck(msgId, receiverUsername) {
    const ack = `ACK|${msgId}|${receiverUsername}`;
    return this.sendRaw(ack);
  }

  /**
   * Get current connection status and stats
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      port: process.env.LORA_PORT || 'COM3',
      baud: process.env.LORA_BAUD || '115200',
      stats: this.stats,
    };
  }

  /* ─────────────────────────────────────────────────────────── */
  /* Private Methods                                             */
  /* ─────────────────────────────────────────────────────────── */

  /**
   * Parse and handle an incoming line from serial port
   */
  async _handleIncomingLine(rawLine) {
    const line = rawLine.trim();

    // Skip debug lines (from STM32 firmware)
    if (!line || line.startsWith('DBG:') || line.startsWith('[')) {
      return;
    }

    // Handle ACK packet
    if (line.startsWith('ACK|')) {
      await this._handleAck(line);
      return;
    }

    // Parse standard message packet
    // Format: msgId|sender|receiver|mode|message|timestamp|RSSI
    const parts = line.split('|');
    if (parts.length < 5) {
      console.warn('[LoRa] Malformed packet:', line);
      return;
    }

    const [msgId, senderUsername, receiverUsername, mode, ...rest] = parts;
    // content might contain '|' — handle gracefully
    const rssi = parseInt(rest[rest.length - 1], 10);
    const timestamp = rest[rest.length - 2];
    const content = rest.slice(0, rest.length - 2).join('|') || rest[0];

    console.log(
      `[LoRa] 📨 FROM=${senderUsername} TO=${receiverUsername} MSG="${content}" RSSI=${rssi}dBm`
    );

    this.stats.messagesReceived++;
    this.stats.lastActivity = new Date();

    await this._persistAndForward({
      msgId,
      senderUsername,
      receiverUsername,
      content: content || rest.join('|'),
      rssi: isNaN(rssi) ? null : rssi,
      mode: mode || 'lora',
    });
  }

  /**
   * Handle ACK packet — update message status to 'delivered'
   * ACK format: ACK|msgId|receiverUsername
   */
  async _handleAck(line) {
    const parts = line.split('|');
    if (parts.length < 3) return;

    const [, msgId, receiverUsername] = parts;
    console.log(`[LoRa] 🔔 ACK received for msgId=${msgId} from ${receiverUsername}`);

    try {
      const message = await Message.findOneAndUpdate(
        { 'loraMetadata.msgId': msgId, status: { $in: ['queued', 'sent'] } },
        {
          $set: {
            status: 'delivered',
            deliveredAt: new Date(),
            'loraMetadata.ackReceived': true,
          },
        },
        { new: true }
      );

      if (message && this.io) {
        // Notify sender that message was delivered
        this.io.emit('message_delivered', {
          messageId: message._id,
          chatId: message.chat,
          status: 'delivered',
        });
      }
    } catch (err) {
      console.error('[LoRa] ACK processing error:', err.message);
    }
  }

  /**
   * Save a LoRa message to MongoDB and forward to Socket.IO clients
   */
  async _persistAndForward({ msgId, senderUsername, receiverUsername, content, rssi, mode }) {
    try {
      const cleanSender = senderUsername.trim().toLowerCase();
      const cleanReceiver = receiverUsername.trim().toLowerCase();

      // Find or create sender and receiver users
      let sender = await User.findOne({ username: cleanSender });
      if (!sender) {
        sender = await User.create({
          username: cleanSender,
          email: `${cleanSender}@antigravity.chat`,
          passwordHash: 'default_password_remote',
          displayName: senderUsername,
          avatar: `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(cleanSender)}`,
          status: 'online',
        });
      }

      let receiver = await User.findOne({ username: cleanReceiver });
      if (!receiver) {
        receiver = await User.create({
          username: cleanReceiver,
          email: `${cleanReceiver}@antigravity.chat`,
          passwordHash: 'default_password_remote',
          displayName: receiverUsername,
          avatar: `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(cleanReceiver)}`,
          status: 'online',
        });
      }

      // Find or create direct chat
      const chat = await Chat.findOrCreateDirect(sender._id, receiver._id);

      // Prevent duplicate messages using msgId
      const existing = await Message.findOne({ 'loraMetadata.msgId': msgId });
      if (existing) {
        console.log(`[LoRa] Duplicate packet ignored: msgId=${msgId}`);
        return;
      }

      // Save message to DB — status 'sent' (ACK will move it to 'delivered')
      const message = await Message.create({
        chat: chat._id,
        sender: sender._id,
        receiver: receiver._id,
        content,
        mode: 'lora',
        status: 'sent',
        sentAt: new Date(),
        loraMetadata: {
          rssi,
          msgId,
          ackReceived: false,
        },
        clientId: msgId,
      });

      // Update chat snapshot
      await Chat.findByIdAndUpdate(chat._id, {
        $set: {
          'lastMessage.content': content,
          'lastMessage.sender': sender._id,
          'lastMessage.timestamp': new Date(),
          'lastMessage.mode': 'lora',
        },
      });

      // Increment unread for receiver
      await chat.incrementUnread(receiver._id);

      // Create notification
      await Notification.create({
        user: receiver._id,
        type: 'lora_message',
        message: message._id,
        chat: chat._id,
        triggeredBy: sender._id,
        preview: content.substring(0, 100),
        loraRssi: rssi,
      });

      const populated = await message.populate([
        { path: 'sender', select: 'username avatar displayName' },
        { path: 'receiver', select: 'username avatar displayName' },
      ]);

      // Emit to all connected Socket.IO clients
      if (this.io) {
        this.io.emit('lora_message', {
          message: populated,
          rssi,
          msgId,
          persisted: true,
        });

        // Also emit as a regular receive_message to the receiver's room
        const receiverSocket = await User.findById(receiver._id).select('socketId');
        if (receiverSocket?.socketId) {
          this.io.to(receiverSocket.socketId).emit('receive_message', populated);
        }
      }

      // Send ACK back to sender over serial
      this.sendAck(msgId, receiverUsername);

      console.log(`[LoRa] ✅ Message persisted & forwarded: ${message._id}`);
    } catch (err) {
      console.error('[LoRa] Persist error:', err.message);
      this.stats.errors++;
    }
  }

  /**
   * Broadcast LoRa connection status to all connected sockets
   */
  _broadcastStatus() {
    if (this.io) {
      this.io.emit('lora_status', this.getStatus());
    }
  }

  /**
   * Schedule reconnection attempt
   */
  _scheduleReconnect() {
    if (this.reconnectTimer) return;
    console.log(`[LoRa] Reconnecting in ${this.reconnectDelay / 1000}s...`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectDelay);
  }
}

// Export singleton instance
module.exports = new LoRaService();
