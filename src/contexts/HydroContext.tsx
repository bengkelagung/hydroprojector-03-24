
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { 
  subscribeToDevices, 
  subscribeToPinConfigs, 
  subscribeToPinData, 
  unsubscribeAll,
  isSubscribedToChannel 
} from '@/services/RealtimeService';

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Device {
  id: string;
  name: string;
  description: string;
  projectId: string;
  createdAt: string;
  lastSeen: string;
  isConnected: boolean;
}

export interface Pin {
  id: string;
  name: string;
  pinNumber: number;
  mode: 'input' | 'output';
  signalType: 'pH' | 'temperature' | 'humidity' | 'water-level' | 'light' | 'digital' | 'nutrient';
  dataType: 'float' | 'integer' | 'boolean' | 'string' | 'digital';
  unit?: string;
  deviceId: string;
  createdAt: string;
  value?: string;
  label?: string;
  lastUpdated?: string;
}

interface HydroContextType {
  user: any | null;
  session: Session | null;
  projects: Project[];
  devices: Device[];
  pins: Pin[];
  signalTypes: string[];
  dataTypes: string[];
  labels: string[];
  pinModes: ('input' | 'output')[];
  getProjects: () => Promise<void>;
  getDevices: () => Promise<void>;
  getPins: () => Promise<void>;
  getPinsByDevice: (deviceId: string) => Pin[];
  createProject: (name: string, description: string) => Promise<void>;
  createDevice: (name: string, description: string, projectId: string) => Promise<void>;
  createPin: (
    name: string,
    pinNumber: number,
    mode: 'input' | 'output',
    signalType: Pin['signalType'],
    dataType: Pin['dataType'],
    unit: string,
    deviceId: string,
    label?: string
  ) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  updateDevice: (deviceId: string, updates: Partial<Device>) => Promise<void>;
  updatePin: (pinId: string, updates: Partial<Pin>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  deleteDevice: (deviceId: string) => Promise<void>;
  deletePin: (pinId: string) => Promise<void>;
  togglePinValue: (pinId: string) => Promise<void>;
}

const HydroContext = createContext<HydroContextType | undefined>(undefined);

export const useHydro = () => {
  const context = useContext(HydroContext);
  if (!context) {
    throw new Error('useHydro must be used within a HydroProvider');
  }
  return context;
};

export const HydroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const signalTypes = ['pH', 'temperature', 'humidity', 'water-level', 'light', 'digital', 'nutrient'];
  const dataTypes = ['float', 'integer', 'boolean', 'string', 'digital'];
  const labels: string[] = ['pH', 'Suhu', 'Kelembaban', 'Lampu', 'Pompa', 'Level Air'];
  const pinModes: ('input' | 'output')[] = ['input', 'output'];
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
        });
        
        setIsLoading(false);
        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error during auth initialization:', error);
        setIsLoading(false);
      }
    }

    getInitialSession();
  }, []);

  // Load data when user is authenticated
  useEffect(() => {
    if (session && !isLoading) {
      // Load initial data
      getProjects();
      getDevices();
      getPins();
    }
  }, [session, isLoading]);

  // Set up realtime subscriptions when user is authenticated
  useEffect(() => {
    if (!user) return;

    // Subscribe to device changes
    const deviceUnsubscribe = subscribeToDevices((deviceId, updates) => {
      console.log('Device update received in context:', deviceId, updates);
      
      if (deviceId === 'refresh-needed') {
        // Refresh the devices list without a full page reload
        getDevices();
        return;
      }
      
      setDevices(prev => prev.map(device => 
        device.id === deviceId 
          ? { 
              ...device, 
              name: updates.device_name || device.name,
              description: updates.description || device.description,
              isConnected: updates.is_connected !== undefined ? updates.is_connected : device.isConnected,
              lastSeen: updates.last_seen || device.lastSeen
            } 
          : device
      ));
    });

    // Subscribe to pin configuration changes
    const pinConfigUnsubscribe = subscribeToPinConfigs((pinId, updates) => {
      console.log('Pin config update received in context:', pinId, updates);
      
      if (pinId === 'refresh-needed') {
        // Refresh the pins list without a full page reload
        getPins();
        return;
      }
      
      setPins(prev => prev.map(pin => 
        pin.id === pinId 
          ? { ...pin, value: updates.value, lastUpdated: updates.last_updated }
          : pin
      ));
    });

    // Subscribe to pin data changes
    const pinDataUnsubscribe = subscribeToPinData((pinConfigId, value) => {
      console.log('Pin data update received in context:', pinConfigId, value);
      
      setPins(prev => prev.map(pin => 
        pin.id === pinConfigId 
          ? { ...pin, value, lastUpdated: new Date().toISOString() }
          : pin
      ));
    });

    // Cleanup on unmount
    return () => {
      if (deviceUnsubscribe) deviceUnsubscribe();
      if (pinConfigUnsubscribe) pinConfigUnsubscribe();
      if (pinDataUnsubscribe) pinDataUnsubscribe();
      unsubscribeAll();
    };
  }, [user]);

  const getProjects = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const formattedProjects: Project[] = data.map(project => ({
        id: project.id,
        name: project.project_name,
        description: project.description || '',
        createdAt: project.created_at
      }));
      
      setProjects(formattedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const getDevices = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const formattedDevices: Device[] = data.map(device => ({
        id: device.id,
        name: device.device_name,
        description: device.description || '',
        projectId: device.project_id,
        createdAt: device.created_at,
        lastSeen: device.last_seen || '',
        isConnected: device.is_connected || false
      }));
      
      setDevices(formattedDevices);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Failed to load devices');
    } finally {
      setIsLoading(false);
    }
  };

  const getPins = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('pin_configs')
        .select(`
          *,
          pins!inner(pin_number, pin_name),
          data_types!inner(name),
          signal_types!inner(name),
          modes!inner(type),
          label(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const formattedPins: Pin[] = data.map(pin => ({
        id: pin.id,
        name: pin.name,
        pinNumber: pin.pins.pin_number,
        mode: pin.modes.type as 'input' | 'output',
        signalType: pin.signal_types.name as Pin['signalType'],
        dataType: pin.data_types.name as Pin['dataType'],
        unit: pin.unit || '',
        deviceId: pin.device_id,
        createdAt: pin.created_at,
        value: pin.value || '',
        label: pin.label?.name || '',
        lastUpdated: pin.last_updated || ''
      }));
      
      setPins(formattedPins);
    } catch (error) {
      console.error('Error fetching pins:', error);
      toast.error('Failed to load pins');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getPinsByDevice = (deviceId: string): Pin[] => {
    return pins.filter(pin => pin.deviceId === deviceId);
  };

  const createProject = async (name: string, description: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ 
          project_name: name, 
          description,
          user_id: user.id 
        }])
        .select();
      
      if (error) throw error;
      
      const newProjects: Project[] = data.map(project => ({
        id: project.id,
        name: project.project_name,
        description: project.description || '',
        createdAt: project.created_at
      }));
      
      setProjects(prev => [...newProjects, ...prev]);
      toast.success('Project created successfully');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  const createDevice = async (name: string, description: string, projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .insert([{ 
          device_name: name, 
          description, 
          project_id: projectId
        }])
        .select();
      
      if (error) throw error;
      
      const newDevices: Device[] = data.map(device => ({
        id: device.id,
        name: device.device_name,
        description: device.description || '',
        projectId: device.project_id,
        createdAt: device.created_at,
        lastSeen: device.last_seen || '',
        isConnected: device.is_connected || false
      }));
      
      setDevices(prev => [...newDevices, ...prev]);
      toast.success('Device created successfully');
    } catch (error) {
      console.error('Error creating device:', error);
      toast.error('Failed to create device');
    }
  };

  const createPin = async (
    name: string,
    pinNumber: number,
    mode: 'input' | 'output',
    signalType: Pin['signalType'],
    dataType: Pin['dataType'],
    unit: string,
    deviceId: string,
    label?: string
  ) => {
    try {
      // Need to get the IDs for each reference value
      const { data: pinData, error: pinError } = await supabase
        .from('pins')
        .select('id')
        .eq('pin_number', pinNumber)
        .single();
      
      if (pinError) throw pinError;
      
      const pinId = pinData.id;
      
      // Get data type ID
      const { data: dataTypeData, error: dataTypeError } = await supabase
        .from('data_types')
        .select('id')
        .eq('name', dataType)
        .single();
      
      if (dataTypeError) throw dataTypeError;
      
      const dataTypeId = dataTypeData.id;
      
      // Get signal type ID
      const { data: signalTypeData, error: signalTypeError } = await supabase
        .from('signal_types')
        .select('id')
        .eq('name', signalType)
        .single();
      
      if (signalTypeError) throw signalTypeError;
      
      const signalTypeId = signalTypeData.id;
      
      // Get mode ID
      const { data: modeData, error: modeError } = await supabase
        .from('modes')
        .select('id')
        .eq('type', mode)
        .single();
      
      if (modeError) throw modeError;
      
      const modeId = modeData.id;
      
      // Get label ID if provided
      let labelId = null;
      if (label) {
        const { data: labelData, error: labelError } = await supabase
          .from('label')
          .select('id')
          .eq('name', label)
          .single();
        
        if (!labelError) {
          labelId = labelData.id;
        }
      }
      
      // Now create the pin configuration
      const { data, error } = await supabase
        .from('pin_configs')
        .insert([{
          name,
          device_id: deviceId,
          pin_id: pinId,
          data_type_id: dataTypeId,
          signal_type_id: signalTypeId,
          mode_id: modeId,
          label_id: labelId,
          unit
        }])
        .select(`
          *,
          pins!inner(pin_number, pin_name),
          data_types!inner(name),
          signal_types!inner(name),
          modes!inner(type),
          label(name)
        `)
        .single();
      
      if (error) throw error;
      
      const newPin: Pin = {
        id: data.id,
        name: data.name,
        pinNumber: data.pins.pin_number,
        mode: data.modes.type as 'input' | 'output',
        signalType: data.signal_types.name as Pin['signalType'],
        dataType: data.data_types.name as Pin['dataType'],
        unit: data.unit || '',
        deviceId: data.device_id,
        createdAt: data.created_at,
        value: data.value || '',
        label: data.label?.name || '',
        lastUpdated: data.last_updated || ''
      };
      
      setPins(prev => [...prev, newPin]);
      toast.success('Pin created successfully');
    } catch (error) {
      console.error('Error creating pin:', error);
      toast.error('Failed to create pin');
    }
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      const supabaseUpdates: any = {};
      
      if (updates.name) supabaseUpdates.project_name = updates.name;
      if (updates.description !== undefined) supabaseUpdates.description = updates.description;
      
      const { error } = await supabase
        .from('projects')
        .update(supabaseUpdates)
        .eq('id', projectId);
      
      if (error) throw error;
      
      setProjects(prev => prev.map(project => 
        project.id === projectId ? { ...project, ...updates } : project
      ));
      toast.success('Project updated successfully');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  const updateDevice = async (deviceId: string, updates: Partial<Device>) => {
    try {
      const supabaseUpdates: any = {};
      
      if (updates.name) supabaseUpdates.device_name = updates.name;
      if (updates.description !== undefined) supabaseUpdates.description = updates.description;
      if (updates.isConnected !== undefined) supabaseUpdates.is_connected = updates.isConnected;
      if (updates.lastSeen !== undefined) supabaseUpdates.last_seen = updates.lastSeen;
      
      const { error } = await supabase
        .from('devices')
        .update(supabaseUpdates)
        .eq('id', deviceId);
      
      if (error) throw error;
      
      setDevices(prev => prev.map(device => 
        device.id === deviceId ? { ...device, ...updates } : device
      ));
      toast.success('Device updated successfully');
    } catch (error) {
      console.error('Error updating device:', error);
      toast.error('Failed to update device');
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      
      if (error) throw error;
      
      setProjects(prev => prev.filter(project => project.id !== projectId));
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const deleteDevice = async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', deviceId);
      
      if (error) throw error;
      
      setDevices(prev => prev.filter(device => device.id !== deviceId));
      toast.success('Device deleted successfully');
    } catch (error) {
      console.error('Error deleting device:', error);
      toast.error('Failed to delete device');
    }
  };

  const deletePin = async (pinId: string) => {
    try {
      const { error } = await supabase
        .from('pin_configs')
        .delete()
        .eq('id', pinId);
      
      if (error) throw error;
      
      setPins(prev => prev.filter(pin => pin.id !== pinId));
      toast.success('Pin deleted successfully');
    } catch (error) {
      console.error('Error deleting pin:', error);
      toast.error('Failed to delete pin');
    }
  };

  const updatePin = async (pinId: string, updates: Partial<Pin>): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Convert pin model to database model
      const supabaseUpdates: any = {};
      
      if (updates.name !== undefined) supabaseUpdates.name = updates.name;
      if (updates.value !== undefined) supabaseUpdates.value = updates.value;
      
      // We would need to look up IDs if these were changing, but for simplicity
      // we're assuming those fields aren't being changed here
      
      supabase
        .from('pin_configs')
        .update(supabaseUpdates)
        .eq('id', pinId)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating pin:', error);
            toast.error('Failed to update pin');
            reject(error);
            return;
          }
          
          setPins(prev => prev.map(pin => 
            pin.id === pinId ? { ...pin, ...updates } : pin
          ));
          
          toast.success('Pin updated successfully');
          resolve();
        })
        .catch((error) => {
          console.error('Error updating pin:', error);
          toast.error('Failed to update pin');
          reject(error);
        });
    });
  };

  const togglePinValue = async (pinId: string) => {
    try {
      // Find the current pin
      const pin = pins.find(p => p.id === pinId);
      if (!pin) {
        throw new Error('Pin not found');
      }
      
      // Determine new value
      const currentValue = pin.value || '0';
      const newValue = currentValue === '1' ? '0' : '1';
      
      // Update pin value in database
      const { error } = await supabase
        .from('pin_configs')
        .update({ value: newValue })
        .eq('id', pinId);
      
      if (error) throw error;
      
      // Also record the change in pin_data for history
      const { error: historyError } = await supabase
        .from('pin_data')
        .insert({ pin_config_id: pinId, value: newValue });
        
      if (historyError) {
        console.error('Failed to record pin history:', historyError);
      }
      
      // Update local state
      setPins(prev => prev.map(pin => 
        pin.id === pinId ? { ...pin, value: newValue } : pin
      ));
      
      toast.success(`${pin.name} turned ${newValue === '1' ? 'on' : 'off'}`);
    } catch (error) {
      console.error('Error toggling pin value:', error);
      toast.error('Failed to toggle pin value');
    }
  };

  const value: HydroContextType = {
    user,
    session,
    projects,
    devices,
    pins,
    signalTypes,
    dataTypes,
    labels,
    pinModes,
    getProjects,
    getDevices,
    getPins,
    getPinsByDevice,
    createProject,
    createDevice,
    createPin,
    updateProject,
    updateDevice,
    updatePin,
    deleteProject,
    deleteDevice,
    deletePin,
    togglePinValue,
  };

  return (
    <HydroContext.Provider value={value}>
      {children}
    </HydroContext.Provider>
  );
};
