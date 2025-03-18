import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { 
  supabase, 
  checkTablesExist, 
  checkLabelColumnExists,
  getDefaultLabels, 
  fetchLabelsFromDatabase, 
  fetchPinConfigsWithRelations,
  fetchPinsWithInfo,
  fetchDataTypes as fetchDataTypesFromDB,
  fetchSignalTypes as fetchSignalTypesFromDB,
  fetchModes as fetchModesFromDB,
  findDataTypeIdByName,
  findSignalTypeIdByName,
  findModeIdByType,
  findLabelIdByName,
  findPinIdByNumber
} from '@/integrations/supabase/client';

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
  wifiConfig?: {
    wifiSSID: string;
    wifiPassword?: string;
  };
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
  label?: string;
  lastUpdated?: string;
}

export interface PinOption {
  id: string;
  name: string;
  pinNumber: number;
}

interface HydroContextType {
  projects: Project[];
  devices: Device[];
  pins: Pin[];
  pinOptions: PinOption[];
  selectedProject: Project | null;
  selectedDevice: Device | null;
  createProject: (name: string, description: string) => Promise<Project>;
  createDevice: (name: string, description: string, projectId: string, type: string) => Promise<Device>;
  configurePin: (
    deviceId: string, 
    pinId: string, 
    dataType: string, 
    signalType: SignalType, 
    mode: 'input' | 'output',
    name: string,
    label?: string
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
  labels: string[];
  fetchLabels: () => Promise<void>;
  fetchDataTypes: () => Promise<void>;
  fetchSignalTypes: () => Promise<void>;
  fetchPinModes: () => Promise<void>;
  fetchPinOptions: () => Promise<void>;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  updateDevice: (deviceId: string, updates: Partial<Device>) => Promise<void>;
  deleteProject: (projectId: string) => void;
  deleteDevice: (deviceId: string) => void;
  deletePin: (pinId: string) => void;
  togglePinValue: (pinId: string) => void;
  updatePin: (pinId: string, updates: Partial<Pin>) => Promise<void>;
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
  const [pinOptions, setPinOptions] = useState<PinOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [dataTypes, setDataTypes] = useState<string[]>([]);
  const [signalTypes, setSignalTypes] = useState<SignalType[]>([]);
  const [pinModes, setPinModes] = useState<('input' | 'output')[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [hasLabelColumn, setHasLabelColumn] = useState<boolean>(false);
  const [tablesChecked, setTablesChecked] = useState<boolean>(false);

  useEffect(() => {
    const checkTables = async () => {
      try {
        const tablesExist = await checkTablesExist();
        if (!tablesExist) {
          toast.error('Database tables not set up. Please run the setup script.');
        }
        
        const labelColumnExists = await checkLabelColumnExists();
        setHasLabelColumn(labelColumnExists);
        setTablesChecked(true);
      } catch (error) {
        console.error('Error checking tables:', error);
        setTablesChecked(true);
      }
    };
    
    checkTables();
  }, []);

  useEffect(() => {
    if (user && tablesChecked) {
      fetchProjects();
      fetchDevices();
      fetchPins();
      fetchDataTypes();
      fetchSignalTypes();
      fetchPinModes();
      fetchPinOptions();
      fetchLabels();
    } else if (!user) {
      setProjects([]);
      setDevices([]);
      setPins([]);
    }
  }, [user, tablesChecked]);

  const fetchProjects = async () => {
    if (!user) return;
    
    try {
      const tableExists = await checkIfTableExists('projects');
      if (!tableExists) {
        console.warn('Projects table does not exist yet');
        return;
      }
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setProjects(data.map(project => ({
        id: project.id,
        name: project.project_name,
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
      const tableExists = await checkIfTableExists('devices');
      if (!tableExists) {
        console.warn('Devices table does not exist yet');
        return;
      }
      
      const projectsExist = await checkIfTableExists('projects');
      if (!projectsExist) {
        console.warn('Projects table does not exist yet');
        return;
      }
      
      const { data, error } = await supabase
        .from('devices')
        .select('*, projects!inner(user_id)')
        .eq('projects.user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setDevices(data.map(device => {
        let wifiConfig;
        try {
          const descriptionObj = JSON.parse(device.description);
          if (descriptionObj && descriptionObj.wifiConfig) {
            wifiConfig = descriptionObj.wifiConfig;
          }
        } catch (e) {
          // Invalid JSON, ignore
        }
        
        return {
          id: device.id,
          name: device.device_name,
          description: device.description || '',
          projectId: device.project_id,
          type: device.device_type,
          isConnected: device.is_connected,
          lastSeen: device.last_seen,
          createdAt: device.created_at,
          wifiConfig: wifiConfig
        };
      }));
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Failed to load devices');
    }
  };

  const fetchPins = async () => {
    if (!user) return;
    
    try {
      const tablesExist = await checkTablesExist();
      if (!tablesExist) {
        console.warn('Required tables do not exist yet');
        return;
      }
      
      const configs = await fetchPinConfigsWithRelations(user.id);
      
      if (!configs || configs.length === 0) {
        setPins([]);
        return;
      }
      
      setPins(configs.map(config => ({
        id: config.id,
        deviceId: config.device_id,
        pinNumber: config.pin_number,
        dataType: config.data_type_name,
        signalType: config.signal_type_name as SignalType,
        mode: config.mode_type as 'input' | 'output',
        name: config.name,
        unit: config.unit || '',
        label: config.label_name || '',
        value: config.value || '',
        lastUpdated: config.last_updated || ''
      })));
      
    } catch (error) {
      console.error('Error fetching pins:', error);
      toast.error('Failed to load pin configurations');
    }
  };

  const fetchPinOptions = async () => {
    try {
      const tableExists = await checkIfTableExists('pins');
      if (!tableExists) {
        console.warn('Pins table does not exist yet');
        return;
      }
      
      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .order('pin_number', { ascending: true });
      
      if (error) throw error;
      
      setPinOptions(data.map(pin => ({
        id: pin.id,
        name: pin.pin_name,
        pinNumber: pin.pin_number
      })));
    } catch (error) {
      console.error('Error fetching pin options:', error);
      toast.error('Failed to load pin options');
    }
  };

  const fetchDataTypes = async () => {
    try {
      const types = await fetchDataTypesFromDB();
      if (types && types.length > 0) {
        setDataTypes(types);
      } else {
        setDataTypes(['integer', 'float', 'boolean', 'string', 'analog', 'digital']);
      }
    } catch (error) {
      console.error('Error fetching data types:', error);
      toast.error('Failed to load data types');
      setDataTypes(['integer', 'float', 'boolean', 'string', 'analog', 'digital']);
    }
  };

  const fetchSignalTypes = async () => {
    try {
      const types = await fetchSignalTypesFromDB();
      if (types && types.length > 0) {
        setSignalTypes(types as SignalType[]);
      } else {
        setSignalTypes(['pH', 'temperature', 'humidity', 'water-level', 'nutrient', 'light', 'analog', 'digital', 'custom']);
      }
    } catch (error) {
      console.error('Error fetching signal types:', error);
      toast.error('Failed to load signal types');
      setSignalTypes(['pH', 'temperature', 'humidity', 'water-level', 'nutrient', 'light', 'analog', 'digital', 'custom']);
    }
  };

  const fetchPinModes = async () => {
    try {
      const modes = await fetchModesFromDB();
      if (modes && modes.length > 0) {
        setPinModes(modes as ('input' | 'output')[]);
      } else {
        setPinModes(['input', 'output']);
      }
    } catch (error) {
      console.error('Error fetching pin modes:', error);
      toast.error('Failed to load pin modes');
      setPinModes(['input', 'output']);
    }
  };

  const fetchLabels = async () => {
    try {
      const labels = await fetchLabelsFromDatabase();
      setLabels(labels);
    } catch (error) {
      console.error('Error in fetchLabels:', error);
      toast.error('Failed to load labels');
      setLabels(getDefaultLabels());
    }
  };

  const createProject = async (name: string, description: string): Promise<Project> => {
    if (!user) throw new Error('User must be logged in to create a project');

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('profile_id')
        .eq('user_id', user.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw new Error('Failed to fetch user profile');
      }
      
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          project_name: name,
          description,
          user_id: user.id,
          profile_id: profileData.profile_id
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      const newProject: Project = {
        id: data.id,
        name: data.project_name,
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
          device_name: name,
          description,
          project_id: projectId,
          device_type: type,
          status: 'ACTIVE'
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      const newDevice: Device = {
        id: data.id,
        name: data.device_name,
        description: data.description || '',
        projectId: data.project_id,
        type: data.device_type,
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
    pinId: string, 
    dataType: string, 
    signalType: SignalType, 
    mode: 'input' | 'output',
    name: string,
    label?: string
  ): Promise<Pin> => {
    try {
      const tablesExist = await checkTablesExist();
      if (!tablesExist) {
        toast.error('Pin configs table does not exist yet. Please run the setup script.');
        throw new Error('Pin configs table does not exist');
      }
      
      const selectedPin = pinOptions.find(p => p.id === pinId);
      if (!selectedPin) {
        throw new Error('Selected pin not found');
      }
      
      const pinNumber = selectedPin.pinNumber;
      
      const existingPin = pins.find(p => p.deviceId === deviceId && p.pinNumber === pinNumber);
      
      const dataTypeId = await findDataTypeIdByName(dataType);
      const signalTypeId = await findSignalTypeIdByName(signalType);
      const modeId = await findModeIdByType(mode);
      const labelId = label ? await findLabelIdByName(label) : null;
      
      if (!dataTypeId || !signalTypeId || !modeId) {
        throw new Error('Failed to get required reference IDs');
      }
      
      let pinData;
      
      const pinConfigData = {
        device_id: deviceId,
        pin_id: pinId,
        data_type_id: dataTypeId,
        signal_type_id: signalTypeId,
        mode_id: modeId,
        label_id: labelId,
        name,
        unit: ""
      };
      
      if (existingPin) {
        const { data, error } = await supabase
          .from('pin_configs')
          .update(pinConfigData)
          .eq('id', existingPin.id)
          .select()
          .single();
        
        if (error) throw error;
        
        pinData = data;
        toast.success('Pin updated successfully!');
      } else {
        const { data, error } = await supabase
          .from('pin_configs')
          .insert([pinConfigData])
          .select()
          .single();
        
        if (error) throw error;
        
        pinData = data;
        toast.success('Pin configured successfully!');
      }
      
      await fetchPins();
      
      const newPin: Pin = {
        id: pinData.id,
        deviceId: pinData.device_id,
        pinNumber: selectedPin.pinNumber,
        dataType: dataType,
        signalType: signalType,
        mode: mode,
        name: pinData.name,
        label: label || '',
        unit: pinData.unit || '',
        value: '',
        lastUpdated: ''
      };
      
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
    
    const wifiSSID = device.wifiConfig?.wifiSSID || "YOUR_WIFI_SSID";
    const wifiPassword = device.wifiConfig?.wifiPassword || "YOUR_WIFI_PASSWORD";
    
    return `
// Hydroprojector Auto-generated code for ${device.name}
// Device ID: ${device.id}

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Wi-Fi credentials
const char* ssid = "${wifiSSID}";
const char* password = "${wifiPassword}";

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

  const updateDevice = async (deviceId: string, updates: Partial<Device>): Promise<void> => {
    try {
      const supabaseUpdates: any = {};
      
      if (updates.name) supabaseUpdates.device_name = updates.name;
      
      if (updates.wifiConfig) {
        const currentDevice = devices.find(d => d.id === deviceId);
        let descriptionObj = {};
        
        try {
          if (currentDevice && currentDevice.description) {
            descriptionObj = JSON.parse(currentDevice.description);
          }
        } catch (e) {
        }
        
        descriptionObj = {
          ...descriptionObj,
          wifiConfig: updates.wifiConfig
        };
        
        supabaseUpdates.description = JSON.stringify(descriptionObj);
      } else if (updates.description !== undefined) {
        supabaseUpdates.description = updates.description;
      }
      
      if (updates.isConnected !== undefined) supabaseUpdates.is_connected = updates.isConnected;
      
      const { error } = await supabase
        .from('devices')
        .update(supabaseUpdates)
        .eq('id', deviceId);
      
      if (error) throw error;
      
      setDevices(prev => 
        prev.map(device => 
          device.id === deviceId ? { ...device, ...updates } : device
        )
      );
      
      toast.success('Device updated successfully');
    } catch (error) {
      console.error('Error updating device:', error);
      toast.error('Failed to update device');
      throw error;
    }
  };

  const deletePin = async (pinId: string) => {
    try {
      const { error: pinDataError } = await supabase
        .from('pin_data')
        .delete()
        .eq('pin_config_id', pinId);
      
      if (pinDataError) {
        console.error('Error deleting pin data:', pinDataError);
        throw pinDataError;
      }
      
      const { error: pinConfigError } = await supabase
        .from('pin_configs')
        .delete()
        .eq('id', pinId);
      
      if (pinConfigError) {
        console.error('Error deleting pin:', pinConfigError);
        throw pinConfigError;
      }
      
      setPins(prev => prev.filter(p => p.id !== pinId));
    } catch (error) {
      console.error('Error in deletePin:', error);
      toast.error('Failed to delete pin');
    }
  };

  const deleteDevice = async (deviceId: string) => {
    try {
      const devicePins = pins.filter(p => p.deviceId === deviceId);
      
      for (const pin of devicePins) {
        await deletePin(pin.id);
      }
      
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', deviceId);
      
      if (error) {
        console.error('Error deleting device:', error);
        throw error;
      }
      
      setDevices(prev => prev.filter(d => d.id !== deviceId));
      
      if (selectedDevice?.id === deviceId) {
        setSelectedDevice(null);
      }
      
      toast.success('Device deleted successfully');
    } catch (error) {
      console.error('Error in deleteDevice:', error);
      toast.error('Failed to delete device');
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const projectDevices = devices.filter(d => d.projectId === projectId);
      
      for (const device of projectDevices) {
        await deleteDevice(device.id);
      }
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      
      if (error) {
        console.error('Error deleting project:', error);
        throw error;
      }
      
      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
      
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Error in deleteProject:', error);
      toast.error('Failed to delete project');
    }
  };

  const togglePinValue = (pinId: string) => {
    const pin = pins.find(p => p.id === pinId);
    if (!pin) return;
    
    const newValue = pin.value === "1" ? "0" : "1";
    
    updatePinValue(pinId, newValue);
  };

  const updatePin = async (pinId: string, updates: Partial<Pin>) => {
    try {
      const updateData: any = {
        name: updates.name,
        signal_type: updates.signalType,
        data_type: updates.dataType
      };
      
      if (hasLabelColumn && updates.label !== undefined) {
        updateData.label = updates.label;
      }
      
      const { error } = await supabase
        .from('pin_configs')
        .update(updateData)
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
      throw error;
    }
  };

  return (
    <HydroContext.Provider
      value={{
        projects,
        devices,
        pins,
        pinOptions,
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
        labels,
        fetchLabels,
        fetchDataTypes,
        fetchSignalTypes,
        fetchPinModes,
        fetchPinOptions,
        updateProject,
        updateDevice,
        deleteProject,
        deleteDevice,
        deletePin,
        togglePinValue,
        updatePin
      }}
    >
      {children}
    </HydroContext.Provider>
  );
};

export default HydroProvider;
