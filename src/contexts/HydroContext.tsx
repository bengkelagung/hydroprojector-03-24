import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

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

export type SignalType = 'pH' | 'temperature' | 'humidity' | 'water-level' | 'nutrient' | 'light' | 'analog' | 'digital' | 'custom';

export interface Pin {
  id: string;
  deviceId: string;
  pinNumber: number;
  dataType: string;
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
    dataType: string, 
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
  dataTypes: string[];
  signalTypes: SignalType[];
  pinModes: ('input' | 'output')[];
  fetchDataTypes: () => Promise<void>;
  fetchSignalTypes: () => Promise<void>;
  fetchPinModes: () => Promise<void>;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  updateDevice: (deviceId: string, updates: Partial<Device>) => void;
  deleteProject: (projectId: string) => void;
  deleteDevice: (deviceId: string) => void;
  deletePin: (pinId: string) => void;
  togglePinValue: (pinId: string) => void;
  updatePin: (pinId: string, updates: Partial<Pin>) => void;
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
  const [dataTypes, setDataTypes] = useState<string[]>([]);
  const [signalTypes, setSignalTypes] = useState<SignalType[]>([]);
  const [pinModes, setPinModes] = useState<('input' | 'output')[]>([]);

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchDevices();
      fetchPins();
      fetchDataTypes();
      fetchSignalTypes();
      fetchPinModes();
    } else {
      setProjects([]);
      setDevices([]);
      setPins([]);
    }
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setProjects(data.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description || '',
        userId: project.user_id,
        createdAt: project.created_at
      })));
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    }
  };

  const fetchDevices = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('devices')
        .select(`
          *,
          projects!inner (
            user_id
          )
        `)
        .eq('projects.user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setDevices(data.map(device => ({
        id: device.id,
        name: device.name,
        description: device.description || '',
        projectId: device.project_id,
        type: device.type,
        isConnected: device.is_connected,
        lastSeen: device.last_seen,
        createdAt: device.created_at
      })));
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Failed to load devices');
    }
  };

  const fetchPins = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('pin_configs')
        .select(`
          *,
          devices!inner (
            id,
            projects!inner (
              user_id
            )
          )
        `)
        .eq('devices.projects.user_id', user.id);
      
      if (error) throw error;
      
      setPins(data.map(pin => ({
        id: pin.id,
        deviceId: pin.device_id,
        pinNumber: pin.pin_number,
        dataType: pin.data_type,
        signalType: pin.signal_type as SignalType,
        mode: pin.mode as 'input' | 'output',
        name: pin.name,
        unit: pin.unit
      })));
    } catch (error) {
      console.error('Error fetching pins:', error);
      toast.error('Failed to load pin configurations');
    }
  };

  const fetchDataTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('data_types')
        .select('name')
        .order('id', { ascending: true });
      
      if (error) throw error;
      
      setDataTypes(data.map(type => type.name));
    } catch (error) {
      console.error('Error fetching data types:', error);
      toast.error('Failed to load data types');
    }
  };

  const fetchSignalTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('signal_types')
        .select('name')
        .order('id', { ascending: true });
      
      if (error) throw error;
      
      setSignalTypes(data.map(type => type.name as SignalType));
    } catch (error) {
      console.error('Error fetching signal types:', error);
      toast.error('Failed to load signal types');
    }
  };

  const fetchPinModes = async () => {
    try {
      const { data, error } = await supabase
        .from('pin_modes')
        .select('name')
        .order('id', { ascending: true });
      
      if (error) throw error;
      
      setPinModes(data.map(mode => mode.name as 'input' | 'output'));
    } catch (error) {
      console.error('Error fetching pin modes:', error);
      toast.error('Failed to load pin modes');
    }
  };

  const createProject = async (name: string, description: string): Promise<Project> => {
    if (!user) throw new Error('User must be logged in to create a project');

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          name,
          description,
          user_id: user.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      const newProject: Project = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        userId: data.user_id,
        createdAt: data.created_at
      };
      
      setProjects(prev => [newProject, ...prev]);
      toast.success('Project created successfully!');
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
      throw error;
    }
  };

  const createDevice = async (
    name: string, 
    description: string, 
    projectId: string, 
    type: string
  ): Promise<Device> => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .insert([{
          name,
          description,
          project_id: projectId,
          type
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      const newDevice: Device = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        projectId: data.project_id,
        type: data.type,
        isConnected: data.is_connected,
        lastSeen: data.last_seen,
        createdAt: data.created_at
      };
      
      setDevices(prev => [newDevice, ...prev]);
      toast.success('Device created successfully!');
      return newDevice;
    } catch (error) {
      console.error('Error creating device:', error);
      toast.error('Failed to create device');
      throw error;
    }
  };

  const configurePin = async (
    deviceId: string, 
    pinNumber: number, 
    dataType: string, 
    signalType: SignalType, 
    mode: 'input' | 'output',
    name: string,
    unit?: string
  ): Promise<Pin> => {
    try {
      const existingPin = pins.find(p => p.deviceId === deviceId && p.pinNumber === pinNumber);
      
      let pinData;
      
      if (existingPin) {
        const { data, error } = await supabase
          .from('pin_configs')
          .update({
            data_type: dataType,
            signal_type: signalType,
            mode,
            name,
            unit
          })
          .eq('id', existingPin.id)
          .select()
          .single();
        
        if (error) throw error;
        
        pinData = data;
        toast.success('Pin updated successfully!');
      } else {
        const { data, error } = await supabase
          .from('pin_configs')
          .insert([{
            device_id: deviceId,
            pin_number: pinNumber,
            data_type: dataType,
            signal_type: signalType,
            mode,
            name,
            unit
          }])
          .select()
          .single();
        
        if (error) throw error;
        
        pinData = data;
        toast.success('Pin configured successfully!');
      }
      
      const newPin: Pin = {
        id: pinData.id,
        deviceId: pinData.device_id,
        pinNumber: pinData.pin_number,
        dataType: pinData.data_type,
        signalType: pinData.signal_type as SignalType,
        mode: pinData.mode as 'input' | 'output',
        name: pinData.name,
        unit: pinData.unit
      };
      
      if (existingPin) {
        setPins(prev => prev.map(p => p.id === existingPin.id ? newPin : p));
      } else {
        setPins(prev => [...prev, newPin]);
      }
      
      return newPin;
    } catch (error) {
      console.error('Error configuring pin:', error);
      toast.error('Failed to configure pin');
      throw error;
    }
  };

  const selectProject = (project: Project | null) => {
    setSelectedProject(project);
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

  const updateDeviceConnection = async (deviceId: string, isConnected: boolean) => {
    try {
      const { error } = await supabase
        .from('devices')
        .update({ 
          is_connected: isConnected,
          last_seen: isConnected ? new Date().toISOString() : undefined
        })
        .eq('id', deviceId);
      
      if (error) throw error;
      
      setDevices(prev => 
        prev.map(device => 
          device.id === deviceId 
            ? { ...device, isConnected, lastSeen: isConnected ? new Date().toISOString() : device.lastSeen } 
            : device
        )
      );
    } catch (error) {
      console.error('Error updating device connection:', error);
      toast.error('Failed to update device connection status');
    }
  };

  const updatePinValue = async (pinId: string, value: string) => {
    try {
      const { error } = await supabase
        .from('pin_data')
        .insert([{
          pin_config_id: pinId,
          value
        }]);
      
      if (error) throw error;
      
      setPins(prev => 
        prev.map(pin => 
          pin.id === pinId 
            ? { ...pin, value, lastUpdated: new Date().toISOString() } 
            : pin
        )
      );
    } catch (error) {
      console.error('Error updating pin value:', error);
      toast.error('Failed to update pin value');
    }
  };

  const generateDeviceCode = (deviceId: string): string => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) throw new Error('Device not found');
    
    const devicePins = pins.filter(p => p.deviceId === deviceId);
    
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
const char* apiEndpoint = "https://azgxttbpxelnlemnvenl.supabase.co/rest/v1/pin_data";
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6Z3h0dGJweGVsbmxlbW52ZW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2OTA5NzAsImV4cCI6MjA1NzI2Njk3MH0.Q5Niw0hZItt4KM-THiCOt9b4g7eDHsH5Wg4PoZ83m8U";

// Function prototypes
void setupWiFi();
void sendSensorData();
${devicePins.map(pin => 
  `void setup${pin.name.replace(/\s+/g, '')}();
void read${pin.name.replace(/\s+/g, '')}();`
).join('\n')}

void setup() {
  Serial.begin(115200);
  setupWiFi();
  
  // Setup pins
${devicePins.map(pin => 
  `  // Setup for ${pin.name} (${pin.signalType}) on pin ${pin.pinNumber}
  pinMode(${pin.pinNumber}, ${pin.mode === 'input' ? 'INPUT' : 'OUTPUT'});`
).join('\n')}
}

void loop() {
  // Read sensors and send data
${devicePins.filter(p => p.mode === 'input').map(pin => 
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
    http.addHeader("apikey", supabaseKey);
    http.addHeader("Prefer", "return=minimal");
    
    // Create JSON document
    StaticJsonDocument<1024> doc;
    
    // Add sensor readings
${devicePins.filter(p => p.mode === 'input').map(pin => {
  const readFunction = pin.dataType === 'float' ? 
    `(float)analogRead(${pin.pinNumber}) / 4095.0 * 3.3` : 
    `${pin.dataType === 'analog' ? 'analogRead' : 'digitalRead'}(${pin.pinNumber})`;
      
  return `    // Send ${pin.name} data
    {
      JsonDocument pinData;
      pinData["pin_config_id"] = "${pin.id}";
      pinData["value"] = String(${readFunction});
      
      String jsonStr;
      serializeJson(pinData, jsonStr);
      
      http.begin(apiEndpoint);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("apikey", supabaseKey);
      http.addHeader("Prefer", "return=minimal");
      
      int httpResponseCode = http.POST(jsonStr);
      if (httpResponseCode > 0) {
        Serial.print("${pin.name} data sent. HTTP Response code: ");
        Serial.println(httpResponseCode);
      }
      else {
        Serial.print("Error sending ${pin.name} data. HTTP Response code: ");
        Serial.println(httpResponseCode);
      }
      
      http.end();
    }`;
}).join('\n\n')}
  }
}

${devicePins.map(pin => {
  const readFunction = pin.dataType === 'float' ? 
    `(float)analogRead(${pin.pinNumber}) / 4095.0 * 3.3` : 
    `${pin.dataType === 'analog' ? 'analogRead' : 'digitalRead'}(${pin.pinNumber})`;
  
  return `
void read${pin.name.replace(/\s+/g, '')}() {
  ${pin.dataType === 'float' ? 'float' : 'int'} ${pin.name.replace(/\s+/g, '')}Value = ${readFunction};
  Serial.print("${pin.name}: ");
  Serial.println(${pin.name.replace(/\s+/g, '')}Value);
}`;
}).join('\n')}
`;
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(prev => 
      prev.map(project => 
        project.id === projectId ? { ...project, ...updates } : project
      )
    );
  };

  const updateDevice = (deviceId: string, updates: Partial<Device>) => {
    setDevices(prev => 
      prev.map(device => 
        device.id === deviceId ? { ...device, ...updates } : device
      )
    );
  };

  const deleteProject = (projectId: string) => {
    const projectDevices = devices.filter(d => d.projectId === projectId);
    
    const deviceIds = projectDevices.map(d => d.id);
    const pinsToDelete = pins.filter(p => deviceIds.includes(p.deviceId));
    pinsToDelete.forEach(pin => {
      supabase
        .from('pin_configs')
        .delete()
        .eq('id', pin.id)
        .then(({ error }) => {
          if (error) console.error('Error deleting pin:', error);
        });
    });
    
    projectDevices.forEach(device => {
      supabase
        .from('devices')
        .delete()
        .eq('id', device.id)
        .then(({ error }) => {
          if (error) console.error('Error deleting device:', error);
        });
    });
    
    supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .then(({ error }) => {
        if (error) console.error('Error deleting project:', error);
      });
    
    setPins(prev => prev.filter(p => !deviceIds.includes(p.deviceId)));
    setDevices(prev => prev.filter(d => d.projectId !== projectId));
    setProjects(prev => prev.filter(p => p.id !== projectId));
    
    if (selectedProject?.id === projectId) {
      setSelectedProject(null);
    }
    
    if (selectedDevice && selectedDevice.projectId === projectId) {
      setSelectedDevice(null);
    }
  };

  const deleteDevice = (deviceId: string) => {
    const devicePins = pins.filter(p => p.deviceId === deviceId);
    devicePins.forEach(pin => {
      supabase
        .from('pin_configs')
        .delete()
        .eq('id', pin.id)
        .then(({ error }) => {
          if (error) console.error('Error deleting pin:', error);
        });
    });
    
    supabase
      .from('devices')
      .delete()
      .eq('id', deviceId)
      .then(({ error }) => {
        if (error) console.error('Error deleting device:', error);
      });
    
    setPins(prev => prev.filter(p => p.deviceId !== deviceId));
    setDevices(prev => prev.filter(d => d.id !== deviceId));
    
    if (selectedDevice?.id === deviceId) {
      setSelectedDevice(null);
    }
  };

  const deletePin = (pinId: string) => {
    supabase
      .from('pin_configs')
      .delete()
      .eq('id', pinId)
      .then(({ error }) => {
        if (error) console.error('Error deleting pin:', error);
      });
    
    setPins(prev => prev.filter(p => p.id !== pinId));
  };

  const togglePinValue = (pinId: string) => {
    const pin = pins.find(p => p.id === pinId);
    if (!pin) return;
    
    const newValue = pin.value === "1" ? "0" : "1";
    
    updatePinValue(pinId, newValue);
  };

  const updatePin = async (pinId: string, updates: Partial<Pin>) => {
    try {
      const { error } = await supabase
        .from('pin_configs')
        .update({
          name: updates.name,
          signal_type: updates.signalType,
          unit: updates.unit
        })
        .eq('id', pinId);
      
      if (error) throw error;
      
      setPins(prev => 
        prev.map(pin => 
          pin.id === pinId ? { ...pin, ...updates } : pin
        )
      );
      
      toast.success('Pin updated successfully');
    } catch (error) {
      console.error('Error updating pin:', error);
      toast.error('Failed to update pin');
    }
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
        generateDeviceCode,
        dataTypes,
        signalTypes,
        pinModes,
        fetchDataTypes,
        fetchSignalTypes,
        fetchPinModes,
        updateProject,
        updateDevice,
        deleteProject,
        deleteDevice,
        deletePin,
        togglePinValue,
        updatePin


