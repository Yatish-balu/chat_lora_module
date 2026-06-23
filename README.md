# 🛸 AntiGravity Chat

A **futuristic hybrid messaging platform** supporting both **Internet (Socket.IO)** and **Offline LoRa (SX1278)** communication — built as an engineering final-year project.

---

## ✨ Features

- 🔐 JWT Authentication (register, login, logout)
- 💬 Real-time messaging via Socket.IO
- 📡 LoRa messaging via STM32/ESP32 + SX1278 (SerialPort)
- ⚡ Hybrid mode — auto-switches between internet and LoRa
- ✓✓ WhatsApp-style message ticks (pending → sent → delivered → read)
- 🟢 Real-time presence (online / away / offline)
- ⌨️ Typing indicators
- 🔔 Toast notifications
- 📊 Dashboard with live statistics
- 🎨 Cyberpunk glassmorphism UI with particle background

---

## 📁 Project Structure

```
chat_lora_module/
├── backend/          Node.js + Express + Socket.IO + MongoDB
└── frontend/         React 18 + TypeScript + Vite + Tailwind
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)
- (Optional) STM32/ESP32 with SX1278 LoRa module

---

### 1. Backend Setup

```bash
cd backend
npm install
```

Copy and edit the env file:
```bash
copy .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/antigravity_chat
JWT_SECRET=your_secret_here
CLIENT_URL=http://localhost:5173

# LoRa settings (set LORA_ENABLED=true when hardware is connected)
LORA_PORT=COM3
LORA_BAUD=115200
LORA_ENABLED=false
```

Start the backend:
```bash
npm run dev
```

The server starts at **http://localhost:5000**

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at **http://localhost:5173**

---

## 📡 LoRa Hardware Setup

### STM32 Firmware (already written)
Your STM32 + SX1278 firmware sends messages in this format:
```
NODEA|Hello World|msg-1|RSSI\r\n
```

The backend `LoRaService.js` parses packets in this format:
```
msgId|sender|receiver|mode|message|timestamp|RSSI\r\n
```

### To enable LoRa:
1. Connect your STM32/ESP32 via USB
2. Set `LORA_ENABLED=true` in `backend/.env`
3. Set `LORA_PORT=COM3` (or your actual COM port)
4. Restart the backend — it will auto-connect to the serial port

---

## 🌐 Communication Modes

| Mode | Description |
|------|-------------|
| 🟢 Online | Messages via Socket.IO / Internet |
| 📡 LoRa | Messages via SX1278 radio (no internet needed) |
| ⚡ Hybrid | Auto-switches — internet first, fallback to LoRa |

---

## 📡 LoRa Packet Protocol

```
msgId|sender|receiver|mode|message|timestamp|RSSI
```

**Example:**
```
124|yatish|arun|lora|hello|1719123345|-75
```

**ACK Response (sent back by server):**
```
ACK|124|arun
```

---

## 🔌 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | No | Register user |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/profile | Yes | Get profile |
| GET | /api/users | Yes | All users |
| GET | /api/users/search?q= | Yes | Search users |
| GET | /api/chats | Yes | Get chats |
| POST | /api/chats | Yes | Create chat |
| GET | /api/messages/:chatId | Yes | Get messages |
| POST | /api/messages/send | Yes | Send message |
| POST | /api/messages/read | Yes | Mark read |
| GET | /health | No | Health check |
| GET | /api/lora/status | No | LoRa status |

---

## ⚡ Socket.IO Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `user_online` | server→all | User came online |
| `user_offline` | server→all | User went offline |
| `typing` | client→room | User typing |
| `stop_typing` | client→room | Stopped typing |
| `send_message` | client→server | Send message |
| `receive_message` | server→client | New message |
| `message_sent` | server→sender | ✓ Sent |
| `message_delivered` | server→sender | ✓✓ Delivered |
| `message_read` | server→sender | ✓✓ Blue |
| `lora_message` | server→all | LoRa message |
| `lora_status` | server→all | LoRa connection |

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary | `#7C3AED` |
| Secondary | `#A855F7` |
| Accent | `#00E5FF` |
| Background | `#0B1020` |
| Surface | `#111827` |
| Card | `#1F2937` |
| Fonts | Inter, Poppins |

---

## 🛠️ Tech Stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Zustand, Socket.IO Client

**Backend:** Node.js, Express.js, Socket.IO, MongoDB, Mongoose, JWT, bcrypt, SerialPort

**Hardware:** STM32F4 / ESP32, SX1278 LoRa (RA-02), 915 MHz

---

## 📸 Pages

1. **Auth Page** — Login / Register with glassmorphism card
2. **Mode Selector** — Choose Online / LoRa / Hybrid
3. **Chat Page** — WhatsApp-style chat with sidebar
4. **Dashboard** — Live stats, LoRa status, online users

---

*Built for engineering final year project & portfolio showcase*