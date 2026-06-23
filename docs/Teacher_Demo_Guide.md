# Chatter — Live Teacher Demonstration Guide

This guide describes how to configure, set up, and present your final year engineering project, **Chatter**, to your teacher or evaluator.

---

## 📋 Pre-Demo Checklist

### On Both Laptops (Laptop A & Laptop B)

1. **Prerequisites**:
   - Install **Node.js** (v18 or higher).
   - Install **VS Code** (or your preferred editor).
2. **Hardware Connection**:
   - Connect one LoRa transceiver to Laptop A via USB.
   - Connect the second LoRa transceiver to Laptop B via USB.
3. **Find the Serial COM Ports**:
   - On Windows: Right-click Start → **Device Manager** → **Ports (COM & LPT)**.
   - Note down the port name (e.g. `COM3` on Laptop A, `COM4` on Laptop B).
4. **Configure Environment Variables**:
   - Open `chat_lora_module/backend/.env`.
   - Ensure the ports match your hardware:
     - **Laptop A `.env`**:
       ```env
       LORA_ENABLED=true
       LORA_PORT=COM3     # Use Laptop A's COM port!
       LORA_BAUD=115200
       LORA_NODE_NAME=NODEA
       ```
     - **Laptop B `.env`**:
       ```env
       LORA_ENABLED=true
       LORA_PORT=COM4     # Use Laptop B's COM port!
       LORA_BAUD=115200
       LORA_NODE_NAME=NODEB
       ```
5. **Flash the Transceivers**:
   - Flash the microcontrollers (Arduino, ESP32, or STM32) with the serial parser code from [firmware/LoRa_Firmware.md](file:///c:/Users/yatis/OneDrive/Desktop/chat_bot/chat_lora_module/firmware/LoRa_Firmware.md).

---

## 🛠️ Step-by-Step Setup (Execute in Front of the Teacher)

1. **Start Backend**:
   - Open a terminal in `chat_lora_module/backend/` and run:
     ```bash
     npm run dev
     ```
   - **Point out to the teacher**: The terminal logs show `[LoRa] ✅ Connected to COMx` and `[MongoDB] ⚠️ Running without database` (highlighting the built-in database-free JSON fallback).

2. **Start Frontend**:
   - Open a second terminal in `chat_lora_module/frontend/` and run:
     ```bash
     npm run dev
     ```

3. **Launch Browser**:
   - Open http://localhost:5173 on both laptops.

---

## 🎤 The Live Demonstration Script (Showcasing Key Features)

### Step 1: Login & Peer Discovery
1. **Explain the simplified login**: 
   - *"We designed a streamlined, password-free access system. Since local databases run independently on each device, a user only needs to enter a name."*
2. **Login**:
   - On **Laptop A**, type `LaptopA` and click **Enter Chat**.
   - On **Laptop B**, type `LaptopB` and click **Enter Chat**.
3. **Discover remote node**:
   - On **Laptop A**, search for `LaptopB` in the search box.
   - **Explain to the teacher**: *"Since Laptop B is on a separate device and database, our backend uses dynamic P2P discovery. Searching for 'LaptopB' automatically creates a local placeholder contact so we can open a chat channel immediately."*
   - Click `LaptopB` in search results to open the chat window.

---

### Step 2: Show Online Mode (Wi-Fi WebSocket Chat)
1. Ensure both laptops are connected to the same Wi-Fi.
2. Select **Online Mode** in the dropdown (top-right of sidebar).
3. Send a message: *"Hello over Wi-Fi!"* from Laptop A.
4. **Explain**: *"In Online Mode, the app behaves like standard internet messengers (WhatsApp/Discord). It routes packets over Socket.IO WebSockets through our Node.js API, showing instant double checkmarks (`✓✓`) for delivery."*

---

### Step 3: Show Offline Mode (LoRa Radio Chat) — *The Wow Factor!*
1. **Simulate a network disaster**: **Turn off Wi-Fi on both laptops!** (Unplug Ethernet or disconnect Wi-Fi).
2. Note that the online WebSocket connection is now disconnected.
3. Switch the communication mode to **LoRa Mode** on both laptops using the selector dropdown.
4. Send a message: *"Hello over LoRa Radio!"* from Laptop A.
5. **Show the magic**:
   - Laptop B will immediately receive the message over the air.
   - Laptop B's screen will update, showing the message.
   - **Watch the backend terminal logs**:
     - Laptop A's backend logs: `[LoRa] 📡 Sending: 4892|laptopa|laptopb|lora|Hello over LoRa Radio!|1719123456`
     - Laptop B's backend logs: `[LoRa] 📨 FROM=laptopa TO=laptopb MSG="Hello over LoRa Radio!" RSSI=-72dBm`
     - Laptop B automatically replies with: `ACK|4892|laptopb`
     - Laptop A gets the ACK and updates the tick to **Delivered** in the UI!
6. **Explain**: *"Even with all Wi-Fi and internet disconnected, we are chatting in real-time. The web UI communicates with our local Node.js server, which uses the SerialPort library to push binary packets to the physical LoRa transceiver over USB. The LoRa modules broadcast over radio frequency peer-to-peer."*

---

### Step 4: Show the Diagnostics Dashboard
1. Click the **Dashboard** button (the layout icon next to your avatar in the left sidebar).
2. **Point out**:
   - **LoRa Module Status**: Shows connection status (`Connected`), Serial Port (`COMx`), Baud Rate (`115200`), and real-time transmission statistics (Packets sent/received).
   - **Signal Strengths**: Point out the signal metrics (RSSI) on incoming packets.
   - **Explain**: *"This admin panel gives real-time diagnostic readouts of the connected LoRa hardware and parses transmission error rates, making it a robust dual-channel engineering platform."*
