# STM32 Offline-Only LoRa Demo Guide

This guide describes how to set up and present a **100% offline, database-free, STM32-to-STM32 LoRa chat demonstration** for your teacher. 

---

## 🔌 Hardware Setup

You will need:
- **Laptop A** (running Node.js & Vite) + **STM32 Board A** + **LoRa Module A**
- **Laptop B** (running Node.js & Vite) + **STM32 Board B** + **LoRa Module B**
- **2 USB cables** to connect the STM32 boards to the laptops.

### Physical Wiring (STM32 to LoRa Module)
Ensure your SPI pins are wired correctly on both boards (adjust pins based on your STM32 configuration):
- **MISO / MOSI / SCK**: Connected to STM32 SPI pins (e.g., SPI1 or SPI2).
- **NSS (CS) / RST**: Connected to configured GPIO Output pins on the STM32.
- **DIO0 (IRQ)**: Connected to an STM32 GPIO Input pin (preferably configured as an external interrupt rising-edge trigger).

### UART Connection (STM32 to Laptop)
1. Connect the STM32 board to the laptop using the USB cable. 
2. If using an onboard ST-Link (standard on Nucleo/Discovery boards), the Virtual COM Port (VCP) routes directly to one of the STM32's USART peripherals (usually `USART2`).
3. If using a custom board, connect a USB-to-TTL Serial adapter (like CP2102 or CH340) to the configured UART TX/RX pins on the STM32, and plug it into the laptop.
4. **Identify the COM Port**: Open **Device Manager** on Windows, expand **Ports (COM & LPT)**, and note the COM port (e.g., `COM3` on Laptop A, `COM4` on Laptop B).

---

## ⚙️ Software Configuration

Perform these steps on both laptops **with all Wi-Fi and Internet turned OFF**:

### Step 1: Configure Laptop A
1. Go to `chat_lora_module/backend/` and open `.env`.
2. Update the environment variables to:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/chatter
   JWT_SECRET=laptop_a_secret_key_123
   CLIENT_URL=http://localhost:5173
   LORA_ENABLED=true
   LORA_PORT=COM3       # Match Laptop A's COM port!
   LORA_BAUD=115200     # Match STM32 USART speed!
   LORA_NODE_NAME=NODEA
   ```

### Step 2: Configure Laptop B
1. Go to `chat_lora_module/backend/` and open `.env`.
2. Update the environment variables to:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/chatter
   JWT_SECRET=laptop_b_secret_key_123
   CLIENT_URL=http://localhost:5173
   LORA_ENABLED=true
   LORA_PORT=COM4       # Match Laptop B's COM port!
   LORA_BAUD=115200     # Match STM32 USART speed!
   LORA_NODE_NAME=NODEB
   ```

---

## 💻 Running the Servers (On Both Laptops)

Open two command prompt or terminal windows on each laptop:

- **Terminal 1 (Backend)**:
  ```bash
  cd backend
  npm run dev
  ```
  *(Verify the console prints: `[LoRa] ✅ Connected to COMx`)*

- **Terminal 2 (Frontend)**:
  ```bash
  cd frontend
  npm run dev
  ```

---

## 🎤 Step-by-Step Live Demonstration Script

Follow this script during your presentation to show the teacher exactly how the system operates offline:

### 1. Show the Offline Launch
- **Action**: Point out to the teacher that **Wi-Fi is completely disabled** on both laptops.
- **Explain**: *"Both laptops are running local web application stacks. Since there is no internet, the app runs offline and automatically redirects database queries to a local JSON file database fallback so no server setup is needed."*

### 2. Enter Nicknames
- **Action**: Open http://localhost:5173 on both browsers.
- **Laptop A**: Enter `LaptopA` and click **Enter Chat**.
- **Laptop B**: Enter `LaptopB` and click **Enter Chat**.
- **Explain**: *"To log in, we enter a nickname. The system automatically registers the device in the background."*

### 3. Establish the P2P Channel
- **Action**: On **Laptop A**, type `LaptopB` in the sidebar search box. Click the result to open a chat.
- **Explain**: *"Since Laptop B is on a separate offline system, searching for 'LaptopB' creates a local placeholder contact so we can establish a peer-to-peer connection channel immediately."*

### 4. Switch to LoRa Mode
- **Action**: Change the mode selector next to the Chatter logo from *Online* to **LoRa** on both laptops.
- **Explain**: *"This tells the website to send all outgoing traffic directly through the connected STM32 LoRa transceivers instead of the network."*

### 5. Send a Message (Laptop A to Laptop B)
- **Action**: Type *"Hello from STM32 Node A!"* on Laptop A and hit **Send**.
- **Show the Teacher**:
  1. **UI Status**: The message displays in Laptop A's chat box with a single gray checkmark (`✓` Sent).
  2. **Laptop A Console**: Look at the backend terminal window on Laptop A. It prints:
     ```
     [LoRa] 📡 Sending: Hello from STM32 Node A!
     ```
     *(The backend writes the raw message text directly over the serial line to the STM32).*
  3. **The Data Flow**: *"When we hit send, the backend writes the raw text to the STM32 UART buffer. The STM32 reads it, increments its local message count, packages it into our custom radio format (`SENDER|TEXT|msgId`), and transmits it over the air. In this case, it transmits `NODEA|Hello from STM32 Node A!|msg-1`."*

### 6. Receive & Send Delivery Acknowledgment (ACK)
- **Action**: Show Laptop B's screen.
- **Show the Teacher**:
  1. **Message Appears**: The message *"Hello from STM32 Node A!"* automatically appears in Laptop B's chat window.
  2. **Laptop B Console**: The backend terminal window on Laptop B prints:
     ```
     [LoRa] 📨 FROM=NODEA TO=NODEB MSG="Hello from STM32 Node A!" RSSI=-70dBm
     ```
     *(This shows the backend successfully parsed the packet received from STM32 B: `NODEA|Hello from STM32 Node A!|msg-1|-70`)*.
  3. **Auto-ACK Transmission**: Point out that Laptop B's backend automatically replies by writing `ACK|msg-1` to its STM32. The STM32 wraps it and transmits it back over the radio wave.
  4. **ACK Received on Laptop A**: Show Laptop A's screen. The gray checkmark has automatically turned into a double blue checkmark (`✓✓` Delivered).
  5. **Explain**: *"This replicates WhatsApp-style delivery status fully offline. When Laptop B receives the packet, it sends back a radio ACK. Laptop A's STM32 receives this ACK, outputs `NODEB|ACK|msg-1|msg-2|-70` to the serial line, which our backend reads to mark the specific message as delivered."*

### 7. Show Hardware Statistics
- **Action**: Click the **Dashboard** button next to your avatar in the sidebar.
- **Explain**: *"This diagnostic screen displays real-time statistics directly read from the UART interface, including the serial connection status, baud rate, and total packets sent/received over the radio module."*
