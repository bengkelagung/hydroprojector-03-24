
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

export interface Project {
  id: string;
  name: string;
  description: string;
  userId: string;
  createdAt: string;
}

export interface Device {
  id: string;
  name: string;
  description: string;
  projectId: string;
  createdAt: string;
  type: string;
  isConnected: boolean;
  lastSeen?: string;
}

export type SignalType = 'pH' | 'temperature' | 'humidity' | 'water-level' | 'nutrient' | 'light' | 'custom';

export interface Pin {
  id: string;
  deviceId: string;
  pinNumber: number;
  dataType: 'analog' | 'digital';
  signalType: SignalType;
  mode: 'input' | 'output';
  name: string;
  value?: string;
  unit?: string;
  lastUpdated?: string;
}

interface HydroContextType {
  projects: Project[];
  devices: Device[];
  pins: Pin[];
  selectedProject: Project | null;
  selectedDevice: Device | null;
  createProject: (name: string, description: string) => Promise<Project>;
  createDevice: (name: string, description: string, projectId: string, type: string) => Promise<Device>;
  configurePin: (
    deviceId: string, 
    pinNumber: number, 
    dataType: 'analog' | 'digital', 
    signalType: SignalType, 
    mode: 'input' | 'output',
    name: string,
    unit?: string
  ) => Promise<Pin>;
  selectProject: (project: Project | null) => void;
  selectDevice: (device: Device | null) => void;
  getDevicesByProject: (projectId: string) => Device[];
  getPinsByDevice: (deviceId: string) => Pin[];
  updateDeviceConnection: (deviceId: string, isConnected: boolean) => void;
  updatePinValue: (pinId: string, value: string) => void;
  generateDeviceCode: (deviceId: string) => string;
}

const HydroContext = createContext<HydroContextType | undefined>(undefined);

export const useHydro = () => {
  const context = useContext(HydroContext);
  if (context === undefined) {
    throw new Error('useHydro must be used within a HydroProvider');
  }
  return context;
};

export const HydroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    if (user) {
      const storedProjects = localStorage.getItem(`hydro_projects_${user.id}`);
      const storedDevices = localStorage.getItem(`hydro_devices_${user.id}`);
      const storedPins = localStorage.getItem(`hydro_pins_${user.id}`);

      if (storedProjects) setProjects(JSON.parse(storedProjects));
      if (storedDevices) setDevices(JSON.parse(storedDevices));
      if (storedPins) setPins(JSON.parse(storedPins));
    }
  }, [user]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(`hydro_projects_${user.id}`, JSON.stringify(projects));
      localStorage.setItem(`hydro_devices_${user.id}`, JSON.stringify(devices));
      localStorage.setItem(`hydro_pins_${user.id}`, JSON.stringify(pins));
    }
  }, [user, projects, devices, pins]);

  const createProject = async (name: string, description: string): Promise<Project> => {
    if (!user) throw new Error('User must be logged in to create a project');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newProject: Project = {
      id: `project_${Date.now()}`,
      name,
      description,
      userId: user.id,
      createdAt: new Date().toISOString()
    };
    
    setProjects(prev => [...prev, newProject]);
    toast.success('Project created successfully!');
    return newProject;
  };

  const createDevice = async (
    name: string, 
    description: string, 
    projectId: string, 
    type: string
  ): Promise<Device> => {
    // Validate project exists
    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newDevice: Device = {
      id: `device_${Date.now()}`,
      name,
      description,
      projectId,
      type,
      isConnected: false,
      createdAt: new Date().toISOString()
    };
    
    setDevices(prev => [...prev, newDevice]);
    toast.success('Device created successfully!');
    return newDevice;
  };

  const configurePin = async (
    deviceId: string, 
    pinNumber: number, 
    dataType: 'analog' | 'digital', 
    signalType: SignalType, 
    mode: 'input' | 'output',
    name: string,
    unit?: string
  ): Promise<Pin> => {
    // Validate device exists
    const device = devices.find(d => d.id === deviceId);
    if (!device) throw new Error('Device not found');

    // Check if pin already exists
    const existingPin = pins.find(p => p.deviceId === deviceId && p.pinNumber === pinNumber);
    if (existingPin) {
      // Update existing pin
      const updatedPin: Pin = {
        ...existingPin,
        dataType,
        signalType,
        mode,
        name,
        unit
      };
      
      setPins(prev => prev.map(p => p.id === existingPin.id ? updatedPin : p));
      toast.success('Pin updated successfully!');
      return updatedPin;
    }

    // Create new pin
    const newPin: Pin = {
      id: `pin_${Date.now()}`,
      deviceId,
      pinNumber,
      dataType,
      signalType,
      mode,
      name,
      unit,
      lastUpdated: new Date().toISOString()
    };
    
    setPins(prev => [...prev, newPin]);
    toast.success('Pin configured successfully!');
    return newPin;
  };

  const selectProject = (project: Project | null) => {
    setSelectedProject(project);
    // Clear selected device if it doesn't belong to this project
    if (project && selectedDevice && selectedDevice.projectId !== project.id) {
      setSelectedDevice(null);
    }
  };

  const selectDevice = (device: Device | null) => {
    setSelectedDevice(device);
  };

  const getDevicesByProject = (projectId: string): Device[] => {
    return devices.filter(device => device.projectId === projectId);
  };

  const getPinsByDevice = (deviceId: string): Pin[] => {
    return pins.filter(pin => pin.deviceId === deviceId);
  };

  const updateDeviceConnection = (deviceId: string, isConnected: boolean) => {
    setDevices(prev => 
      prev.map(device => 
        device.id === deviceId 
          ? { ...device, isConnected, lastSeen: isConnected ? new Date().toISOString() : device.lastSeen } 
          : device
      )
    );
  };

  const updatePinValue = (pinId: string, value: string) => {
    setPins(prev => 
      prev.map(pin => 
        pin.id === pinId 
          ? { ...pin, value, lastUpdated: new Date().toISOString() } 
          : pin
      )
    );
  };

  const generateDeviceCode = (deviceId: string): string => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) throw new Error('Device not found');
    
    // Generate Arduino code for ESP32
    return `
// Hydroprojector Auto-generated code for ${device.name}
// Device ID: ${device.id}

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Wi-Fi credentials - replace with your own
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Device identifier
const char* deviceId = "${device.id}";

// API endpoint (replace with your actual endpoint in production)
const char* apiEndpoint = "https://your-hydroponics-api.com/data";

// Function prototypes
void setupWiFi();
void sendSensorData();
${pins.filter(p => p.deviceId === deviceId).map(pin => 
  `void setup${pin.name.replace(/\s+/g, '')}();
void read${pin.name.replace(/\s+/g, '')}();`
).join('\n')}

void setup() {
  Serial.begin(115200);
  setupWiFi();
  
  // Setup pins
${pins.filter(p => p.deviceId === deviceId).map(pin => 
  `  // Setup for ${pin.name} (${pin.signalType}) on pin ${pin.pinNumber}
  pinMode(${pin.pinNumber}, ${pin.mode === 'input' ? 'INPUT' : 'OUTPUT'});`
).join('\n')}
}

void loop() {
  // Read sensors and send data
${pins.filter(p => p.deviceId === deviceId && p.mode === 'input').map(pin => 
  `  read${pin.name.replace(/\s+/g, '')}();`
).join('\n')}
  
  // Send data to server
  sendSensorData();
  
  // Wait before next reading
  delay(10000);  // 10 seconds
}

void setupWiFi() {
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void sendSensorData() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(apiEndpoint);
    http.addHeader("Content-Type", "application/json");
    
    // Create JSON document
    StaticJsonDocument<200> doc;
    doc["deviceId"] = deviceId;
    
    // Add sensor readings
${pins.filter(p => p.deviceId === deviceId && p.mode === 'input').map(pin => 
  `    doc["${pin.name}"] = ${pin.dataType === 'analog' ? 'analogRead' : 'digitalRead'}(${pin.pinNumber});`
).join('\n')}
    
    // Serialize JSON to string
    String requestBody;
    serializeJson(doc, requestBody);
    
    // Send HTTP POST request
    int httpResponseCode = http.POST(requestBody);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("HTTP Response code: " + String(httpResponseCode));
      Serial.println(response);
    } else {
      Serial.println("Error on HTTP request");
    }
    
    http.end();
  }
}

${pins.filter(p => p.deviceId === deviceId).map(pin => `
void read${pin.name.replace(/\s+/g, '')}() {
  int ${pin.name.replace(/\s+/g, '')}Value = ${pin.dataType === 'analog' ? 'analogRead' : 'digitalRead'}(${pin.pinNumber});
  Serial.print("${pin.name}: ");
  Serial.println(${pin.name.replace(/\s+/g, '')}Value);
}`).join('\n')}
`;
  };

  return (
    <HydroContext.Provider
      value={{
        projects,
        devices,
        pins,
        selectedProject,
        selectedDevice,
        createProject,
        createDevice,
        configurePin,
        selectProject,
        selectDevice,
        getDevicesByProject,
        getPinsByDevice,
        updateDeviceConnection,
        updatePinValue,
        generateDeviceCode
      }}
    >
      {children}
    </HydroContext.Provider>
  );
};
