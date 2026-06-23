/**
 * Chatter — Backend Server
 * ─────────────────────────────────────────────────────────────
 * Express + Socket.IO + MongoDB + LoRa SerialPort integration
 * ─────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chats');
const messageRoutes = require('./routes/messages');
const { initSocketManager } = require('./socket/socketManager');
const LoRaService = require('./services/LoRaService');
const { errorHandler, notFound } = require('./middleware/error');

/* ─── App Setup ─────────────────────────────────────────────── */
const app = express();
const httpServer = http.createServer(app);

/* ─── Socket.IO ─────────────────────────────────────────────── */
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

/* ─── Security Middleware ────────────────────────────────────── */
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);

/* ─── CORS ──────────────────────────────────────────────────── */
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

/* ─── Rate Limiting ─────────────────────────────────────────── */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

/* ─── Body Parsing ──────────────────────────────────────────── */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ─── Logging (dev only) ─────────────────────────────────────── */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/* ─── Health Check ───────────────────────────────────────────── */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Chatter API is running',
    timestamp: new Date().toISOString(),
    lora: LoRaService.getStatus(),
    uptime: process.uptime(),
  });
});

/* ─── API Routes ─────────────────────────────────────────────── */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);

/* ─── LoRa Status Endpoint ───────────────────────────────────── */
app.get('/api/lora/status', (req, res) => {
  res.status(200).json({ success: true, ...LoRaService.getStatus() });
});

/* ─── 404 + Error Handlers ───────────────────────────────────── */
app.use(notFound);
app.use(errorHandler);

/* ─── MongoDB Connection ─────────────────────────────────────── */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/chatter',
      {
        serverSelectionTimeoutMS: 5000,
      }
    );
    console.log(`[MongoDB] ✅ Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('[MongoDB] ❌ Connection failed:', err.message);
    console.warn('[MongoDB] ⚠️  Running without database. Install MongoDB or set MONGO_URI in .env');
    console.warn('[MongoDB] 💡 Get free MongoDB Atlas at: https://www.mongodb.com/atlas');
    // Do NOT exit — allow server to run for LoRa-only mode
  }
};

/* ─── Start Server ───────────────────────────────────────────── */
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  // Initialize Socket.IO event manager
  initSocketManager(io);

  // Inject io into LoRa service so it can emit socket events
  LoRaService.setSocketIO(io);

  // Connect to LoRa serial port (non-blocking)
  LoRaService.connect().catch((err) => {
    console.warn('[LoRa] Initial connection failed (will retry):', err?.message);
  });

  httpServer.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║             Chatter Server               ║
║──────────────────────────────────────────║
║  HTTP  : http://localhost:${PORT}           ║
║  Mode  : ${process.env.NODE_ENV || 'development'}                    ║
║  LoRa  : ${process.env.LORA_ENABLED === 'true' ? `✅ ${process.env.LORA_PORT || 'COM3'}` : '❌ Disabled'}                   ║
╚══════════════════════════════════════════╝
    `);
  });
};

startServer();

/* ─── Graceful Shutdown ──────────────────────────────────────── */
const gracefulShutdown = async (signal) => {
  console.log(`\n[Server] ${signal} received. Shutting down...`);
  LoRaService.disconnect();
  await mongoose.connection.close();
  httpServer.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled Rejection:', reason);
});
