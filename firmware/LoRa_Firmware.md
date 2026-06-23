# Chatter — LoRa Module Firmware Templates

These firmware templates configure your LoRa transceivers (ESP32, Arduino, or STM32) to talk to the **Chatter** desktop application over the Serial Port (USB).

---

## 1. Arduino / ESP32 (using SX1276 / SX1278 / RFM95)
This code uses the popular **LoRa** library by Sandeep Mistry. Install it via the Arduino IDE Library Manager before uploading.

### Pin Connections (Example for ESP32):
- **NSS / CS**: IO 5
- **RST**: IO 14
- **DIO0**: IO 2
- **SCK**: IO 18
- **MISO**: IO 19
- **MOSI**: IO 23

```cpp
#include <SPI.h>
#include <LoRa.h>

#define BAND 915E6  // Change to match your country's band: 433E6, 868E6, or 915E6

// Pin Definitions (adjust for your board)
const int csPin = 5;          // LoRa radio chip select
const int resetPin = 14;       // LoRa radio reset
const int irqPin = 2;         // Hardware interrupt pin (must be connected to DIO0)

String serialBuffer = "";

void setup() {
  Serial.begin(115200);
  while (!Serial);

  Serial.println("[LoRa Module] Initializing...");

  // Set pins
  LoRa.setPins(csPin, resetPin, irqPin);

  // Initialize LoRa
  if (!LoRa.begin(BAND)) {
    Serial.println("[LoRa Module] Failed to initialize. Check hardware connections!");
    while (true);
  }

  Serial.println("[LoRa Module] ✅ Online & ready at 115200 baud.");
}

void loop() {
  // ─── 1. Receive from Web App (Serial) and Transmit over LoRa ───
  while (Serial.available() > 0) {
    char inChar = (char)Serial.read();
    if (inChar == '\n' || inChar == '\r') {
      if (serialBuffer.length() > 0) {
        // Broadcast over LoRa air waves
        LoRa.beginPacket();
        LoRa.print(serialBuffer);
        LoRa.endPacket();

        // Print debug message (ignored by backend due to DBG: prefix)
        Serial.print("DBG: Sent packet over air: ");
        Serial.println(serialBuffer);

        serialBuffer = "";
      }
    } else {
      serialBuffer += inChar;
    }
  }

  // ─── 2. Receive from LoRa (Air) and Write to Web App (Serial) ───
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    String rxData = "";
    while (LoRa.available()) {
      rxData += (char)LoRa.read();
    }

    int rssi = LoRa.packetRssi();

    // Protocol formatting:
    // If it's an ACK packet, it doesn't need RSSI. Format is: ACK|msgId|receiver
    // If standard packet, format is: msgId|sender|receiver|mode|message|timestamp|RSSI
    if (rxData.startsWith("ACK|")) {
      Serial.print(rxData);
      Serial.print("\r\n");
    } else {
      Serial.print(rxData);
      Serial.print("|");
      Serial.print(rssi);
      Serial.print("\r\n");
    }
  }
}
```

---

## 2. STM32 (CubeHAL + SX1278)
If you are compiling for STM32 using Keil or STM32CubeIDE, your SPI and USART peripherals should be pre-configured.

Here is the general state-machine logic to include in your main loop:

### SPI/LoRa Helper Code:
```c
#include "main.h"
#include <stdio.h>
#include <string.h>

extern UART_HandleTypeDef huart2;  // Match your USART handle (e.g. huart2 to USB-TTL)
extern SPI_HandleTypeDef hspi1;   // Match your SPI handle connected to SX1278

#define RX_BUFFER_SIZE 256
uint8_t rxBuffer[RX_BUFFER_SIZE];
uint8_t rxIndex = 0;

/* Send raw string to computer over Serial (COM) */
void Serial_Println(char* str) {
    HAL_UART_Transmit(&huart2, (uint8_t*)str, strlen(str), 100);
    HAL_UART_Transmit(&huart2, (uint8_t*)"\r\n", 2, 100);
}

/* Transmit packet over SPI LoRa */
void LoRa_Transmit(uint8_t* data, uint8_t length) {
    // 1. Put SX1278 in Standby mode
    // 2. Set payload length, FIFO pointer address
    // 3. Write data buffer to FIFO register
    // 4. Set SX1278 to Transmit (TX) mode
    // 5. Wait for TxDone interrupt on DIO0 pin
}

/* Check for serial data from Desktop app */
void Check_Computer_Messages(void) {
    uint8_t byte;
    // Non-blocking UART check
    if (HAL_UART_Receive(&huart2, &byte, 1, 0) == HAL_OK) {
        if (byte == '\n' || byte == '\r') {
            if (rxIndex > 0) {
                rxBuffer[rxIndex] = '\0';
                
                // Transmit what computer sent over LoRa
                LoRa_Transmit(rxBuffer, rxIndex);
                
                rxIndex = 0; // reset buffer
            }
        } else {
            if (rxIndex < RX_BUFFER_SIZE - 1) {
                rxBuffer[rxIndex++] = byte;
            }
        }
    }
}

/* Check for incoming LoRa packets from another node */
void Check_Air_Messages(void) {
    // 1. Check if DIO0 pin is HIGH (RxDone interrupt)
    // 2. Read packet length and received payload from LoRa FIFO register
    // 3. Read packet RSSI register value
    // 4. Print received string to computer: 
    //    Format standard: "msgId|sender|receiver|lora|message|timestamp|RSSI"
    //    Format ACK: "ACK|msgId|receiverUsername"
    
    /* Pseudocode example:
    if (LoRa_ReceivedPacket()) {
        char packet[256];
        int rssi = LoRa_GetRSSI();
        LoRa_ReadPayload(packet);
        
        char formatted[300];
        if (strncmp(packet, "ACK|", 4) == 0) {
            sprintf(formatted, "%s", packet);
        } else {
            sprintf(formatted, "%s|%d", packet, rssi);
        }
        Serial_Println(formatted);
    }
    */
}
```
