
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
const char* WIFI_PASSWORD = "${device.wifiConfig.wifiPassword || ''}";
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

`;

  // Add pin definitions based on configured pins
  deviceCode += generatePinDefinitions(pins);
  
  // Add setup function
  deviceCode += generateSetupFunction(pins);
  
  // Add loop function
  deviceCode += generateLoopFunction(pins);

  return deviceCode;
};

/**
 * Generate pin definitions for the device
 * @param pins Array of configured pins
 * @returns Generated pin definitions as a string
 */
const generatePinDefinitions = (pins: any[]) => {
  let code = `// Pin Configuration\n`;
  
  const inputPins = pins.filter(pin => pin.mode === 'input');
  const outputPins = pins.filter(pin => pin.mode === 'output');
  
  // Define input pins
  inputPins.forEach(pin => {
    code += `#define ${pin.name.toUpperCase().replace(/\s+/g, '_')}_PIN ${pin.pinNumber}  // ${pin.dataType}, ${pin.signalType}${pin.label ? ', Label: ' + pin.label : ''}\n`;
  });
  
  // Define output pins
  outputPins.forEach(pin => {
    code += `#define ${pin.name.toUpperCase().replace(/\s+/g, '_')}_PIN ${pin.pinNumber}  // ${pin.dataType}, ${pin.signalType}${pin.label ? ', Label: ' + pin.label : ''}\n`;
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
  } else {
    Serial.println();
    Serial.println("Failed to connect to WiFi. Please check credentials.");
  }
  
  // Initialize pins
`;

  // Setup input pins
  const inputPins = pins.filter(pin => pin.mode === 'input');
  inputPins.forEach(pin => {
    const pinName = pin.name.toUpperCase().replace(/\s+/g, '_');
    if (pin.signalType === 'digital') {
      code += `  pinMode(${pinName}_PIN, INPUT);\n`;
    } else if (pin.signalType === 'analog') {
      // No pinMode needed for analog input on ESP32
      code += `  // Analog input ${pinName}_PIN\n`;
    }
  });
  
  // Setup output pins
  const outputPins = pins.filter(pin => pin.mode === 'output');
  outputPins.forEach(pin => {
    const pinName = pin.name.toUpperCase().replace(/\s+/g, '_');
    code += `  pinMode(${pinName}_PIN, OUTPUT);\n`;
  });

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
  DynamicJsonDocument sensorData(1024);
  sensorData["device_id"] = DEVICE_ID;
  JsonArray readings = sensorData.createNestedArray("readings");
  
`;

  // Add code to read input pins
  const inputPins = pins.filter(pin => pin.mode === 'input');
  inputPins.forEach(pin => {
    const pinName = pin.name.toUpperCase().replace(/\s+/g, '_');
    const pinVarName = pin.name.toLowerCase().replace(/\s+/g, '_');
    
    if (pin.signalType === 'digital') {
      code += `  // Read ${pin.name} (digital)
  int ${pinVarName}_value = digitalRead(${pinName}_PIN);
  JsonObject ${pinVarName}_reading = readings.createNestedObject();
  ${pinVarName}_reading["pin_id"] = "${pin.id}";
  ${pinVarName}_reading["value"] = ${pinVarName}_value;
  Serial.print("${pin.name}: "); Serial.println(${pinVarName}_value);\n\n`;
    } else if (pin.signalType === 'analog') {
      code += `  // Read ${pin.name} (analog)
  int ${pinVarName}_raw = analogRead(${pinName}_PIN);
  float ${pinVarName}_value = ${pinVarName}_raw;
  
  // Apply conversion for ${pin.dataType} if needed
  ${pin.dataType === 'temperature' ? '// Convert raw analog to temperature\n  ' + pinVarName + '_value = (' + pinVarName + '_raw * 3.3 / 4095.0 - 0.5) * 100.0;' : '// No conversion needed for ' + pin.dataType}
  
  JsonObject ${pinVarName}_reading = readings.createNestedObject();
  ${pinVarName}_reading["pin_id"] = "${pin.id}";
  ${pinVarName}_reading["value"] = ${pinVarName}_value;
  Serial.print("${pin.name}: "); Serial.println(${pinVarName}_value);\n\n`;
    }
  });

  // Add code to handle output pins
  const outputPins = pins.filter(pin => pin.mode === 'output');
  if (outputPins.length > 0) {
    code += `  // Handle output pins based on latest commands\n`;
    code += `  // In a real implementation, you would fetch commands from the server\n`;
    
    outputPins.forEach(pin => {
      const pinName = pin.name.toUpperCase().replace(/\s+/g, '_');
      
      if (pin.signalType === 'digital') {
        code += `  // Example: digitalWrite(${pinName}_PIN, HIGH or LOW);\n`;
      } else if (pin.signalType === 'analog') {
        code += `  // Example: analogWrite(${pinName}_PIN, value);\n`;
      }
    });
    code += '\n';
  }

  // Add code to send data to server
  code += `  // Send data to server
  if (readings.size() > 0) {
    sendDataToServer(sensorData);
  }
  
  // Wait before next reading
  delay(READING_INTERVAL);
}

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
`;

  return code;
};
