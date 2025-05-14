// Device code generator utility functions
// Generates Arduino code for ESP32 devices with WiFi and pin configurations

/**
 * Generate Arduino code for an ESP32 device with WiFi and pin configurations
 * @param device The device object with id, name, type and WiFi configuration
 * @param pins Array of configured pins for the device
 * @returns Generated Arduino code as a string
 */
export const generateDeviceCodeWithConfig = (device: any, pins: any[]) => {
  // Base code structure
  let deviceCode = `
// Auto-generated code for ${device.name} (${device.type.toUpperCase()})
// Generated on: ${new Date().toLocaleString()}

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <UniversalTelegramBot.h>
#include <WiFiClientSecure.h>

// Device information
const char* DEVICE_ID = "${device.id}";
const char* DEVICE_NAME = "${device.name}";
const char* DEVICE_TYPE = "${device.type}";
`;

  // Add WiFi configuration if available
  if (device.wifiConfig && device.wifiConfig.wifiSSID) {
    deviceCode += `
// WiFi Configuration
const char* WIFI_SSID = "${device.wifiConfig.wifiSSID}";
const char* WIFI_PASSWORD = "${device.wifiConfig.wifiPassword || ""}";
`;
  } else {
    deviceCode += `
// WiFi Configuration - NOT CONFIGURED
// You need to configure WiFi credentials on the device setup page
const char* WIFI_SSID = ""; // WiFi not configured - please set up in device settings!
const char* WIFI_PASSWORD = ""; // WiFi not configured - please set up in device settings!
`;
  }

  // Add API endpoint configuration
  deviceCode += `
// API Configuration
const char* API_ENDPOINT = "https://hydroponics-api.example.com/data";
const int HTTP_TIMEOUT = 10000; // 10 seconds

// Sensor reading interval
const int READING_INTERVAL = 5000; // Read sensors every 5 seconds

// Telegram Bot Configuration
#define BOT_TOKEN "8028205316:AAETned3PdmcZd4F05t7XbEKWZJh0nlMcFE"
#define CHAT_ID "" // Add your chat ID here

// Initialize Telegram bot
WiFiClientSecure secured_client;
UniversalTelegramBot bot(BOT_TOKEN, secured_client);

// Alert thresholds - modify these based on your needs
struct AlertThresholds {
  float ph_min = 5.5;
  float ph_max = 7.5;
  float temp_min = 18.0;
  float temp_max = 28.0;
  float humidity_min = 40.0;
  float humidity_max = 90.0;
  float water_level_min = 40.0;
} thresholds;

// Virtual pins (for Blynk-like functionality)
struct VirtualPin {
  String id;
  String name;
  String dataType;
  float value;
};

// Define virtual pins array
VirtualPin virtualPins[10]; // Support up to 10 virtual pins
int virtualPinCount = 0;

`;

  // Add pin definitions based on configured pins
  deviceCode += generatePinDefinitions(pins);

  // Add setup function
  deviceCode += generateSetupFunction(pins);

  // Add loop function
  deviceCode += generateLoopFunction(pins);

  // Add helper functions
  deviceCode += generateHelperFunctions();

  return deviceCode;
};

/**
 * Generate pin definitions for the device
 * @param pins Array of configured pins
 * @returns Generated pin definitions as a string
 */
const generatePinDefinitions = (pins: any[]) => {
  let code = `// Pin Configuration\n`;

  const inputPins = pins.filter((pin) => pin.mode === "input");
  const outputPins = pins.filter((pin) => pin.mode === "output");

  // Define input pins
  inputPins.forEach((pin) => {
    code += `#define ${pin.name.toUpperCase().replace(/\s+/g, "_")}_PIN ${pin.pinNumber}  // ${pin.dataType}, ${pin.signalType}${pin.label ? ", Label: " + pin.label : ""}\n`;
  });

  // Define output pins
  outputPins.forEach((pin) => {
    code += `#define ${pin.name.toUpperCase().replace(/\s+/g, "_")}_PIN ${pin.pinNumber}  // ${pin.dataType}, ${pin.signalType}${pin.label ? ", Label: " + pin.label : ""}\n`;
  });

  return code;
};

/**
 * Generate setup function for the Arduino code
 * @param pins Array of configured pins
 * @returns Generated setup function as a string
 */
const generateSetupFunction = (pins: any[]) => {
  let code = `
void setup() {
  // Initialize serial communication
  Serial.begin(115200);
  Serial.println("Starting device setup...");
  
  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  
  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 20) {
    delay(500);
    Serial.print(".");
    wifiAttempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("Connected to WiFi network with IP Address: ");
    Serial.println(WiFi.localIP());
    
    // Send startup notification via Telegram
    if (strlen(CHAT_ID) > 0) {
      secured_client.setCACert(TELEGRAM_CERTIFICATE_ROOT);
      bot.sendMessage(CHAT_ID, String(DEVICE_NAME) + " is now online!", "");
    }
  } else {
    Serial.println();
    Serial.println("Failed to connect to WiFi. Please check credentials.");
  }
  
  // Initialize pins
`;

  // Setup input pins
  const inputPins = pins.filter((pin) => pin.mode === "input");
  inputPins.forEach((pin) => {
    const pinName = pin.name.toUpperCase().replace(/\s+/g, "_");
    if (pin.signalType === "digital") {
      code += `  pinMode(${pinName}_PIN, INPUT);\n`;
    } else if (pin.signalType === "analog") {
      // No pinMode needed for analog input on ESP32
      code += `  // Analog input ${pinName}_PIN\n`;
    }
  });

  // Setup output pins
  const outputPins = pins.filter((pin) => pin.mode === "output");
  outputPins.forEach((pin) => {
    const pinName = pin.name.toUpperCase().replace(/\s+/g, "_");
    code += `  pinMode(${pinName}_PIN, OUTPUT);\n`;
  });

  // Initialize virtual pins
  code += `
  // Initialize virtual pins
  initializeVirtualPins();
`;

  // Finish setup
  code += `
  Serial.println("Device setup completed.");
}
`;

  return code;
};

/**
 * Generate loop function for the Arduino code
 * @param pins Array of configured pins
 * @returns Generated loop function as a string
 */
const generateLoopFunction = (pins: any[]) => {
  let code = `
void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi connection lost. Reconnecting...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    delay(5000);
    return;
  }
  
  // Read sensor values
  DynamicJsonDocument sensorData(2048);
  sensorData["device_id"] = DEVICE_ID;
  JsonArray readings = sensorData.createNestedArray("readings");
  
`;

  // Add code to read input pins
  const inputPins = pins.filter((pin) => pin.mode === "input");
  inputPins.forEach((pin) => {
    const pinName = pin.name.toUpperCase().replace(/\s+/g, "_");
    const pinVarName = pin.name.toLowerCase().replace(/\s+/g, "_");

    if (pin.signalType === "digital") {
      code += `  // Read ${pin.name} (digital)
  int ${pinVarName}_value = digitalRead(${pinName}_PIN);
  JsonObject ${pinVarName}_reading = readings.createNestedObject();
  ${pinVarName}_reading["pin_id"] = "${pin.id}";
  ${pinVarName}_reading["value"] = ${pinVarName}_value;
  Serial.print("${pin.name}: "); Serial.println(${pinVarName}_value);
  
  // Update virtual pin if mapped
  updateVirtualPin("${pin.id}", ${pinVarName}_value);

`;
    } else if (pin.signalType === "analog") {
      code += `  // Read ${pin.name} (analog)
  int ${pinVarName}_raw = analogRead(${pinName}_PIN);
  float ${pinVarName}_value = ${pinVarName}_raw;
  
  // Apply conversion for ${pin.dataType} if needed
  ${pin.dataType === "temperature" ? "// Convert raw analog to temperature\n  " + pinVarName + "_value = (" + pinVarName + "_raw * 3.3 / 4095.0 - 0.5) * 100.0;" : "// No conversion needed for " + pin.dataType}
  
  JsonObject ${pinVarName}_reading = readings.createNestedObject();
  ${pinVarName}_reading["pin_id"] = "${pin.id}";
  ${pinVarName}_reading["value"] = ${pinVarName}_value;
  Serial.print("${pin.name}: "); Serial.println(${pinVarName}_value);
  
  // Update virtual pin if mapped
  updateVirtualPin("${pin.id}", ${pinVarName}_value);
  
  // Check for alert conditions
  checkAlertConditions("${pin.name}", "${pin.dataType}", ${pinVarName}_value);

`;
    }
  });

  // Add code to handle output pins
  const outputPins = pins.filter((pin) => pin.mode === "output");
  if (outputPins.length > 0) {
    code += `  // Handle output pins based on latest commands\n`;
    code += `  // In a real implementation, you would fetch commands from the server\n`;

    outputPins.forEach((pin) => {
      const pinName = pin.name.toUpperCase().replace(/\s+/g, "_");

      if (pin.signalType === "digital") {
        code += `  // Example: digitalWrite(${pinName}_PIN, HIGH or LOW);\n`;
      } else if (pin.signalType === "analog") {
        code += `  // Example: analogWrite(${pinName}_PIN, value);\n`;
      }
    });
    code += "\n";
  }

  // Add code to send data to server
  code += `  // Send data to server
  if (readings.size() > 0) {
    sendDataToServer(sensorData);
  }
  
  // Wait before next reading
  delay(READING_INTERVAL);
}
`;

  return code;
};

/**
 * Generate helper functions for the Arduino code
 * @returns Generated helper functions as a string
 */
const generateHelperFunctions = () => {
  return `
// Function to send data to server
void sendDataToServer(DynamicJsonDocument& data) {
  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT);
  
  // Your server endpoint
  http.begin(API_ENDPOINT);
  http.addHeader("Content-Type", "application/json");
  
  // Serialize JSON and send
  String jsonString;
  serializeJson(data, jsonString);
  Serial.print("Sending data: ");
  Serial.println(jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.println(response);
  } else {
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

// Function to initialize virtual pins
void initializeVirtualPins() {
  virtualPinCount = 0;
  
  // Example: Add a virtual pin for temperature control
  addVirtualPin("V0", "Temperature Control", "temperature");
  
  // Example: Add a virtual pin for humidity control
  addVirtualPin("V1", "Humidity Control", "humidity");
  
  // Example: Add a virtual pin for pH control
  addVirtualPin("V2", "pH Control", "pH");
  
  Serial.println("Virtual pins initialized");
}

// Function to add a virtual pin
void addVirtualPin(String id, String name, String dataType) {
  if (virtualPinCount < 10) {
    virtualPins[virtualPinCount].id = id;
    virtualPins[virtualPinCount].name = name;
    virtualPins[virtualPinCount].dataType = dataType;
    virtualPins[virtualPinCount].value = 0.0;
    virtualPinCount++;
  }
}

// Function to update a virtual pin value
void updateVirtualPin(String pinId, float value) {
  for (int i = 0; i < virtualPinCount; i++) {
    if (virtualPins[i].id == pinId) {
      virtualPins[i].value = value;
      break;
    }
  }
}

// Function to check alert conditions and send notifications
void checkAlertConditions(String sensorName, String dataType, float value) {
  if (strlen(CHAT_ID) == 0) return; // Skip if no chat ID is configured
  
  String alertMessage = "";
  bool sendAlert = false;
  
  if (dataType == "pH" || dataType == "ph") {
    if (value < thresholds.ph_min) {
      alertMessage = "⚠️ ALERT: " + sensorName + " pH is too low: " + String(value) + ". Minimum recommended: " + String(thresholds.ph_min);
      sendAlert = true;
    } else if (value > thresholds.ph_max) {
      alertMessage = "⚠️ ALERT: " + sensorName + " pH is too high: " + String(value) + ". Maximum recommended: " + String(thresholds.ph_max);
      sendAlert = true;
    }
  } else if (dataType == "temperature") {
    if (value < thresholds.temp_min) {
      alertMessage = "❄️ ALERT: " + sensorName + " temperature is too low: " + String(value) + "°C. Minimum recommended: " + String(thresholds.temp_min) + "°C";
      sendAlert = true;
    } else if (value > thresholds.temp_max) {
      alertMessage = "🔥 ALERT: " + sensorName + " temperature is too high: " + String(value) + "°C. Maximum recommended: " + String(thresholds.temp_max) + "°C";
      sendAlert = true;
    }
  } else if (dataType == "humidity") {
    if (value < thresholds.humidity_min) {
      alertMessage = "🏜️ ALERT: " + sensorName + " humidity is too low: " + String(value) + "%. Minimum recommended: " + String(thresholds.humidity_min) + "%";
      sendAlert = true;
    } else if (value > thresholds.humidity_max) {
      alertMessage = "💧 ALERT: " + sensorName + " humidity is too high: " + String(value) + "%. Maximum recommended: " + String(thresholds.humidity_max) + "%";
      sendAlert = true;
    }
  } else if (dataType == "water-level") {
    if (value < thresholds.water_level_min) {
      alertMessage = "🚱 ALERT: " + sensorName + " water level is too low: " + String(value) + "%. Minimum recommended: " + String(thresholds.water_level_min) + "%";
      sendAlert = true;
    }
  }
  
  if (sendAlert) {
    secured_client.setCACert(TELEGRAM_CERTIFICATE_ROOT);
    bot.sendMessage(CHAT_ID, alertMessage, "");
    Serial.println("Alert sent: " + alertMessage);
  }
}

// Root certificate for api.telegram.org
const char* TELEGRAM_CERTIFICATE_ROOT = R"=====(
-----BEGIN CERTIFICATE-----
MIIDxTCCAq2gAwIBAgIBADANBgkqhkiG9w0BAQsFADCBgzELMAkGA1UEBhMCVVMx
EDAOBgNVBAgTB0FyaXpvbmExEzARBgNVBAcTClNjb3R0c2RhbGUxGjAYBgNVBAoT
EUdvRGFkZHkuY29tLCBJbmMuMTEwLwYDVQQDEyhHbyBEYWRkeSBSb290IENlcnRp
ZmljYXRlIEF1dGhvcml0eSAtIEcyMB4XDTA5MDkwMTAwMDAwMFoXDTM3MTIzMTIz
NTk1OVowgYMxCzAJBgNVBAYTAlVTMRAwDgYDVQQIEwdBcml6b25hMRMwEQYDVQQH
EwpTY290dHNkYWxlMRowGAYDVQQKExFHb0RhZGR5LmNvbSwgSW5jLjExMC8GA1UE
AxMoR28gRGFkZHkgUm9vdCBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkgLSBHMjCCASIw
DQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAL9xYgjx+lk09xvJGKP3gElY6SKD
E6bFIEMBO4Tx5oVJnyfq9oQbTqC023CYxzIBsQU+B07u9PpPL1kwIuerGVZr4oAH
/PMWdYA5UXvl+TW2dE6pjYIT5LY/qQOD+qK+ihVqf94Lw7YZFAXK6sOoBJQ7Rnwy
DfMAZiLIjWltNowRGLfTshxgtDj6AozO091GB94KPutdfMh8+7ArU6SSYmlRJQVh
GkSBjCypQ5Yj36w6gZoOKcUcqeldHraenjAKOc7xiID7S13MMuyFYkMlNAJWJwGR
tDtwKj9useiciAF9n9T521NtYJ2/LOdYq7hfRvzOxBsDPAnrSTFcaUaz4EcCAwEA
AaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMCAQYwHQYDVR0OBBYE
FDqahQcQZyi27/a9BUFuIMGU2g/eMA0GCSqGSIb3DQEBCwUAA4IBAQCZ21151fmX
WWcDYfF+OwYxdS2hII5PZYe096acvNjpL9DbWu7PdIxztDhC2gV7+AJ1uP2lsdeu
9tfeE8tTEH6KRtGX+rcuKxGrkLAngPnon1rpN5+r5N9ss4UXnT3ZJE95kTXWXwTr
gIOrmgIttRD02JDHBHNA7XIloKmf7J6raBKZV8aPEjoJpL1E/QYVN8Gb5DKj7Tjo
2GTzLH4U/ALqn83/B2gX2yKQOC16jdFU8WnjXzPKej17CuPKf1855eJ1usV2GDPO
LPAvTK33sefOT6jEm0pUBsV/fdUID+Ic/n4XuKxe9tQWskMJDE32p2u0mYRlynqI
4uJEvlz36hz1
-----END CERTIFICATE-----
)=====";
`;
};
