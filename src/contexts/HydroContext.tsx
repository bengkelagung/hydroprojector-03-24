
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, logSupabaseError } from '../integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

// Interface definitions to match the actual database schema
export interface Project {
  id: string;
  project_name: string;
  description: string;
  user_id: string;
  created_at?: string;
  profile_id?: string;
}

export interface Device {
  id: string;
  device_name: string;
  device_type: string;
  created_at?: string;
  project_id: string | null;
  status: string;
  description?: string;
  is_connected?: boolean | null;
  last_seen?: string | null;
  projects?: Project;
  wifiConfig?: {
    wifiSSID: string;
    wifiPassword?: string;
  };
}

export interface Pin {
  id: string;
  created_at?: string;
  device_id: string;
  pin_number: number;
  mode: string;
  name: string;
  signal_type: string;
  data_type: string;
  unit?: string | null;
  value?: string;
  label?: string;
}

interface HydroContextType {
  projects: Project[];
  devices: Device[];
  pins: Pin[];
  labels: string[];
  selectedProjectId: string | null;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
  setPins: React.Dispatch<React.SetStateAction<Pin[]>>;
  setLabels: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedProjectId: React.Dispatch<React.SetStateAction<string | null>>;
  createProject: (name: string) => Promise<void>;
  createDevice: (device: Omit<Device, 'id' | 'created_at'>) => Promise<void>;
  createPin: (pin: Omit<Pin, 'id' | 'created_at'>) => Promise<void>;
  createLabel: (name: string) => Promise<void>;
  updateDevice: (deviceId: string, updates: Partial<Device>) => Promise<void>;
  fetchDevices: () => Promise<void>;
  fetchPins: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  fetchLabels: () => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  deleteDevice: (deviceId: string) => Promise<void>;
  deletePin: (pinId: string) => Promise<void>;
  deleteLabel: (labelId: string) => Promise<void>;
  getDevicesByProject: (projectId: string) => Device[];
  getPinsByDevice: (deviceId: string) => Pin[];
  configurePin: (
    deviceId: string, 
    pinId: string, 
    dataType: string, 
    signalType: string, 
    mode: 'input' | 'output', 
    name: string,
    label?: string
  ) => Promise<void>;
  pinOptions: { id: string; name: string; pinNumber: number }[];
  dataTypes: string[];
  signalTypes: string[];
  pinModes: string[];
}

export const HydroContext = createContext<HydroContextType>({} as HydroContextType);

export const HydroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Mock data for pin configuration
  const pinOptions = [
    { id: 'pin-1', name: 'Digital Pin 1', pinNumber: 1 },
    { id: 'pin-2', name: 'Digital Pin 2', pinNumber: 2 },
    { id: 'pin-3', name: 'Digital Pin 3', pinNumber: 3 },
    { id: 'pin-4', name: 'Digital Pin 4', pinNumber: 4 },
    { id: 'pin-5', name: 'Analog Pin A0', pinNumber: 14 },
    { id: 'pin-6', name: 'Analog Pin A1', pinNumber: 15 },
    { id: 'pin-7', name: 'Analog Pin A2', pinNumber: 16 },
  ];
  
  const dataTypes = ['integer', 'float', 'boolean', 'string'];
  const signalTypes = ['digital', 'analog', 'pwm', 'i2c', 'spi', 'uart'];
  const pinModes = ['input', 'output'];

  const { user } = useAuth();

  const createProject = async (name: string) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('projects')
        .insert([{ 
          project_name: name,
          description: '', // Required field according to schema
          user_id: user.id 
        }])
        .select()
        .single();

      if (error) {
        logSupabaseError(error, 'creating project');
        throw error;
      }

      setProjects([...projects, data]);
      toast.success('Project created successfully!');
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  const createDevice = async (device: Omit<Device, 'id' | 'created_at'>) => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Convert to match the database schema
      const deviceData = {
        device_name: device.device_name,
        device_type: device.device_type,
        project_id: device.project_id,
        status: device.status,
        description: device.description || ''
      };

      const { data, error } = await supabase
        .from('devices')
        .insert([deviceData])
        .select()
        .single();

      if (error) {
        logSupabaseError(error, 'creating device');
        throw error;
      }

      // Add the wifiConfig if it exists
      if (device.wifiConfig) {
        const descriptionObj = data.description ? 
          JSON.parse(data.description) : {};
        
        descriptionObj.wifiConfig = device.wifiConfig;
        
        const { error: updateError } = await supabase
          .from('devices')
          .update({ description: JSON.stringify(descriptionObj) })
          .eq('id', data.id);
          
        if (updateError) {
          logSupabaseError(updateError, 'updating device with WiFi config');
          throw updateError;
        }
      }

      await fetchDevices();
      toast.success('Device created successfully!');
    } catch (error: any) {
      console.error('Error creating device:', error);
      toast.error('Failed to create device');
    }
  };

  const createPin = async (pin: Omit<Pin, 'id' | 'created_at'>) => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Adapt to the pin_configs table structure
      const pinData = {
        device_id: pin.device_id,
        pin_number: pin.pin_number,
        mode: pin.mode,
        name: pin.name,
        signal_type: pin.signal_type,
        data_type: pin.data_type,
        unit: pin.unit,
        label: pin.label
      };

      const { data, error } = await supabase
        .from('pin_configs')
        .insert([pinData])
        .select()
        .single();

      if (error) {
        logSupabaseError(error, 'creating pin configuration');
        throw error;
      }

      setPins([...pins, data as Pin]);
      toast.success('Pin configuration created successfully!');
    } catch (error: any) {
      console.error('Error creating pin configuration:', error);
      toast.error('Failed to create pin configuration');
    }
  };

  const configurePin = async (
    deviceId: string, 
    pinId: string, 
    dataType: string, 
    signalType: string, 
    mode: 'input' | 'output', 
    name: string,
    label?: string
  ) => {
    try {
      // Find the pin from our options
      const pinOption = pinOptions.find(p => p.id === pinId);
      if (!pinOption) {
        throw new Error('Invalid pin selected');
      }

      // Create the pin configuration
      const pinData: Omit<Pin, 'id' | 'created_at'> = {
        device_id: deviceId,
        pin_number: pinOption.pinNumber,
        mode,
        name,
        signal_type: signalType,
        data_type: dataType,
        label
      };

      await createPin(pinData);
      
      toast.success(`Pin ${name} configured successfully!`);
    } catch (error: any) {
      console.error('Error configuring pin:', error);
      toast.error('Failed to configure pin');
      throw error;
    }
  };

  const createLabel = async (name: string) => {
    try {
      if (!labels.includes(name)) {
        setLabels([...labels, name]);
        toast.success('Label created successfully!');
      } else {
        toast.info('Label already exists');
      }
    } catch (error: any) {
      console.error('Error creating label:', error);
      toast.error('Failed to create label');
    }
  };

  // Fixed version to handle WiFi configuration properly
  const updateDevice = async (deviceId: string, updates: Partial<Device>) => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      // Convert the updates to match the database schema
      const deviceUpdates: any = {};
      
      if (updates.device_name) deviceUpdates.device_name = updates.device_name;
      if (updates.device_type) deviceUpdates.device_type = updates.device_type;
      if (updates.status) deviceUpdates.status = updates.status;
      if (updates.project_id) deviceUpdates.project_id = updates.project_id;
      
      // Handle wifiConfig special case
      if (updates.wifiConfig) {
        // Get the current device to preserve other properties
        const { data: deviceData, error: deviceError } = await supabase
          .from('devices')
          .select('*')
          .eq('id', deviceId)
          .single();
          
        if (deviceError) {
          logSupabaseError(deviceError, 'getting device for WiFi update');
          throw deviceError;
        }
        
        // If the device has a description, try to parse it, otherwise create new object
        let descriptionObj = {};
        if (deviceData.description) {
          try {
            descriptionObj = JSON.parse(deviceData.description);
          } catch (e) {
            console.warn('Failed to parse device description, creating new object', e);
          }
        }
        
        // Add wifiConfig to description object
        descriptionObj = {
          ...descriptionObj,
          wifiConfig: updates.wifiConfig
        };
        
        deviceUpdates.description = JSON.stringify(descriptionObj);
      } else if (updates.description !== undefined) {
        deviceUpdates.description = updates.description;
      }
      
      // Update the device with the prepared updates
      const { error } = await supabase
        .from('devices')
        .update(deviceUpdates)
        .eq('id', deviceId);
      
      if (error) {
        logSupabaseError(error, 'updating device');
        throw error;
      }
      
      // Refresh devices list
      await fetchDevices();
      toast.success('Device updated successfully!');
      
    } catch (error: any) {
      console.error('Error updating device:', error);
      toast.error('Failed to update device');
      throw error;
    }
  };

  // Updated to match database schema and handle WiFi configuration from description field
  const fetchDevices = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('devices')
        .select(`
          *,
          projects(
            id,
            project_name,
            user_id
          )
        `)
        .eq('projects.user_id', user.id);
        
      if (error) {
        logSupabaseError(error, 'fetching devices');
        throw error;
      }
      
      // Process the devices to extract wifiConfig from description
      const processedDevices = data.map(device => {
        let wifiConfig = undefined;
        
        // Try to parse description if it exists
        if (device.description) {
          try {
            const descriptionObj = JSON.parse(device.description);
            if (descriptionObj.wifiConfig) {
              wifiConfig = descriptionObj.wifiConfig;
            }
          } catch (e) {
            console.warn(`Failed to parse description for device ${device.id}`, e);
          }
        }
        
        return {
          ...device,
          wifiConfig
        };
      });
      
      setDevices(processedDevices);
      
    } catch (error: any) {
      console.error('Error fetching devices:', error);
      toast.error('Failed to load devices');
    }
  };

  const fetchPins = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('pin_configs')
        .select('*');

      if (error) {
        logSupabaseError(error, 'fetching pin configurations');
        throw error;
      }

      setPins(data as Pin[]);
    } catch (error: any) {
      console.error('Error fetching pin configurations:', error);
      toast.error('Failed to load pin configurations');
    }
  };

  const fetchProjects = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logSupabaseError(error, 'fetching projects');
        throw error;
      }

      setProjects(data);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    }
  };

  const fetchLabels = async () => {
    // Using fixed labels for now since there's no labels table
    setLabels(['pH', 'TDS', 'Temperature', 'Humidity', 'Light', 'Water Level', 'Nutrients']);
  };

  const deleteProject = async (projectId: string) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        logSupabaseError(error, 'deleting project');
        throw error;
      }

      setProjects(projects.filter(project => project.id !== projectId));
      toast.success('Project deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const deleteDevice = async (deviceId: string) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', deviceId);

      if (error) {
        logSupabaseError(error, 'deleting device');
        throw error;
      }

      setDevices(devices.filter(device => device.id !== deviceId));
      toast.success('Device deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting device:', error);
      toast.error('Failed to delete device');
    }
  };

  const deletePin = async (pinId: string) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('pin_configs')
        .delete()
        .eq('id', pinId);

      if (error) {
        logSupabaseError(error, 'deleting pin configuration');
        throw error;
      }

      setPins(pins.filter(pin => pin.id !== pinId));
      toast.success('Pin configuration deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting pin configuration:', error);
      toast.error('Failed to delete pin configuration');
    }
  };

  const deleteLabel = async (labelId: string) => {
    try {
      setLabels(labels.filter(label => label !== labelId));
      toast.success('Label deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting label:', error);
      toast.error('Failed to delete label');
    }
  };

  // Helper function to get devices for a specific project
  const getDevicesByProject = (projectId: string) => {
    return devices.filter(device => device.project_id === projectId);
  };

  // Helper function to get pins for a specific device
  const getPinsByDevice = (deviceId: string) => {
    return pins.filter(pin => pin.device_id === deviceId);
  };

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchProjects(),
        fetchDevices(),
        fetchPins(),
        fetchLabels()
      ]);
    }
  }, [user]);

  return (
    <HydroContext.Provider
      value={{
        projects,
        devices,
        pins,
        labels,
        selectedProjectId,
        setProjects,
        setDevices,
        setPins,
        setLabels,
        setSelectedProjectId,
        createProject,
        createDevice,
        createPin,
        createLabel,
        updateDevice,
        fetchDevices,
        fetchPins,
        fetchProjects,
        fetchLabels,
        deleteProject,
        deleteDevice,
        deletePin,
        deleteLabel,
        getDevicesByProject,
        getPinsByDevice,
        configurePin,
        pinOptions,
        dataTypes,
        signalTypes,
        pinModes,
      }}
    >
      {children}
    </HydroContext.Provider>
  );
};

export const useHydro = () => useContext(HydroContext);
