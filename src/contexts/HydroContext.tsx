import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { 
  subscribeToDevices, 
  subscribeToPinConfigs, 
  subscribeToPinData, 
  unsubscribeAll 
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
    deviceId: string
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

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
    
      supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      });
    }

    getInitialSession();
  }, []);

  useEffect(() => {
    if (session) {
      getProjects();
      getDevices();
      getPins();
    }
  }, [session]);

  // Set up realtime subscriptions when user is authenticated
  useEffect(() => {
    if (!user) return;

    // Subscribe to device changes
    const unsubscribeDevices = subscribeToDevices((deviceId, updates) => {
      console.log('Device update received in context:', deviceId, updates);
      
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
    const unsubscribePinConfigs = subscribeToPinConfigs((pinId, updates) => {
      console.log('Pin config update received in context:', pinId, updates);
      
      if (updates.value !== undefined) {
        setPins(prev => prev.map(pin => 
          pin.id === pinId 
            ? { ...pin, value: updates.value }
            : pin
        ));
      }
    });

    // Subscribe to pin data changes
    const unsubscribePinData = subscribeToPinData((pinConfigId, value) => {
      console.log('Pin data update received in context:', pinConfigId, value);
      
      setPins(prev => prev.map(pin => 
        pin.id === pinConfigId 
          ? { ...pin, value, lastUpdated: new Date().toISOString() }
          : pin
      ));
    });

    // Cleanup on unmount
    return () => {
      unsubscribeDevices?.();
      unsubscribePinConfigs?.();
      unsubscribePinData?.();
      unsubscribeAll();
    };
  }, [user]);

  const getProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    }
  };

  const getDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      
      setDevices(data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Failed to load devices');
    }
  };

  const getPins = async () => {
    try {
      const { data, error } = await supabase
        .from('pin_configs')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      
      setPins(data || []);
    } catch (error) {
      console.error('Error fetching pins:', error);
      toast.error('Failed to load pins');
    }
  };
  
  const getPinsByDevice = (deviceId: string): Pin[] => {
    return pins.filter(pin => pin.deviceId === deviceId);
  };

  const createProject = async (name: string, description: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ name, description }])
        .select();
      
      if (error) throw error;
      
      setProjects(prev => [...prev, ...data]);
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
        .insert([{ name, description, projectId }])
        .select();
      
      if (error) throw error;
      
      setDevices(prev => [...prev, ...data]);
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
    deviceId: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('pin_configs')
        .insert([{ name, pinNumber, mode, signalType, dataType, unit, deviceId }])
        .select();
      
      if (error) throw error;
      
      setPins(prev => [...prev, ...data]);
      toast.success('Pin created successfully');
    } catch (error) {
      console.error('Error creating pin:', error);
      toast.error('Failed to create pin');
    }
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update(updates)
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
      const { error } = await supabase
        .from('devices')
        .update(updates)
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

  const updatePin = (pinId: string, updates: Partial<Pin>): Promise<void> => {
    return new Promise((resolve, reject) => {
      supabase
        .from('pin_configs')
        .update(updates)
        .eq('id', pinId)
        .then(({ error }) => {
          if (error) throw error;
          
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
      // Fetch the current pin value
      const { data: pinData, error: pinError } = await supabase
        .from('pin_configs')
        .select('value')
        .eq('id', pinId)
        .single();
  
      if (pinError) {
        console.error('Error fetching pin value:', pinError);
        throw pinError;
      }
  
      const currentValue = pinData?.value === '1' ? '0' : '1';
  
      // Update the pin value in the database
      const { error: updateError } = await supabase
        .from('pin_configs')
        .update({ value: currentValue })
        .eq('id', pinId);
  
      if (updateError) {
        console.error('Error toggling pin value:', updateError);
        throw updateError;
      }
  
      // Optimistically update the local state
      setPins(prevPins =>
        prevPins.map(pin =>
          pin.id === pinId ? { ...pin, value: currentValue } : pin
        )
      );
    } catch (error) {
      console.error('Error toggling pin value:', error);
      toast.error('Failed to toggle pin value');
      throw error;
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
