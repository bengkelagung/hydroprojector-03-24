import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import { 
  subscribeToDevices, 
  subscribeToPinConfigs, 
  subscribeToPinData,
  unsubscribeAll
} from '@/services/RealtimeService';
import { executeWithRetry, handleSupabaseError } from '@/utils/supabaseHelpers';
import { 
  storeDevices, 
  storePins, 
  storeProjects, 
  getCachedDevices,
  getCachedPins,
  getCachedProjects,
  queueChange,
  storeRecentPinData,
  getRecentPinData
} from '@/utils/offlineStorage';

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
  wifiConfig?: {
    ssid?: string;
    password?: string;
  };
  type?: string;
}

export interface Pin {
  id: string;
  name: string;
  pinNumber: number;
  mode: 'input' | 'output';
  signalType: 'pH' | 'temperature' | 'humidity' | 'water-level' | 'light' | 'digital' | 'nutrient' | 'pump' | 'water-pump' | 'custom';
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
  getDevicesByProject: (projectId: string) => Device[];
  createProject: (name: string, description: string) => Promise<string>;
  createDevice: (name: string, description: string, projectId: string) => Promise<string>;
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
  generateDeviceCode: (deviceId: string) => Promise<string>;
  updateDeviceConnection: (deviceId: string, isConnected: boolean) => Promise<void>;
  configurePin: (deviceId: string, config: any) => Promise<void>;
  pinOptions: any[];
  fetchLabels: () => Promise<string[]>;
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
  const signalTypes = ['pH', 'temperature', 'humidity', 'water-level', 'light', 'digital', 'nutrient', 'pump', 'water-pump', 'custom'];
  const dataTypes = ['float', 'integer', 'boolean', 'string', 'digital'];
  const labels: string[] = ['pH', 'Suhu', 'Kelembaban', 'Lampu', 'Pompa', 'Level Air'];
  const pinModes: ('input' | 'output')[] = ['input', 'output'];
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    if (session && !isLoading) {
      getProjects();
      getDevices();
      getPins();
    }
  }, [session, isLoading]);

  useEffect(() => {
    if (!user) return;

    const deviceUnsubscribe = subscribeToDevices((deviceId, updates) => {
      console.log('Device update received in context:', deviceId, updates);
      
      if (deviceId === 'refresh-needed') {
        getDevices();
        return;
      }
      
      // Handle cached devices update
      if (deviceId === 'cached-devices' && Array.isArray(updates)) {
        console.log('Setting cached devices:', updates.length);
        setDevices(updates);
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

    const pinConfigUnsubscribe = subscribeToPinConfigs((pinId, updates) => {
      console.log('Pin config update received in context:', pinId, updates);
      
      if (pinId === 'refresh-needed') {
        getPins();
        return;
      }
      
      // Handle cached pins update
      if (pinId === 'cached-pins' && Array.isArray(updates)) {
        console.log('Setting cached pins:', updates.length);
        setPins(updates);
        return;
      }
      
      setPins(prev => prev.map(pin => 
        pin.id === pinId 
          ? { ...pin, value: updates.value, lastUpdated: updates.last_updated }
          : pin
      ));
    });

    const pinDataUnsubscribe = subscribeToPinData((pinConfigId, value) => {
      console.log('Pin data update received in context:', pinConfigId, value);
      
      setPins(prev => prev.map(pin => 
        pin.id === pinConfigId 
          ? { ...pin, value, lastUpdated: new Date().toISOString() }
          : pin
      ));
    });

    // Listen for offline mode events
    const handleOfflineMode = () => {
      console.log('Switching to offline mode');
      const cachedDevices = getCachedDevices();
      const cachedPins = getCachedPins();
      const cachedProjects = getCachedProjects();
      
      if (cachedDevices.length > 0) setDevices(cachedDevices);
      if (cachedPins.length > 0) setPins(cachedPins);
      if (cachedProjects.length > 0) setProjects(cachedProjects);
      
      toast({
        title: "Offline Mode",
        description: "Using cached data. Changes will be synchronized when online."
      });
    };
    
    window.addEventListener('supabase-connection-closed', handleOfflineMode);
    window.addEventListener('supabase-connection-failed', handleOfflineMode);

    return () => {
      if (deviceUnsubscribe) deviceUnsubscribe();
      if (pinConfigUnsubscribe) pinConfigUnsubscribe();
      if (pinDataUnsubscribe) pinDataUnsubscribe();
      unsubscribeAll();
      
      window.removeEventListener('supabase-connection-closed', handleOfflineMode);
      window.removeEventListener('supabase-connection-failed', handleOfflineMode);
    };
  }, [user]);

  useEffect(() => {
    const handleRefreshData = () => {
      getProjects();
      getDevices();
      getPins();
    };

    window.addEventListener('refresh-data', handleRefreshData);
    
    return () => {
      window.removeEventListener('refresh-data', handleRefreshData);
    };
  }, []);

  const getProjects = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await executeWithRetry(
        () => supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false }),
        'Failed to load projects'
      );
      
      if (error) throw error;
      
      const formattedProjects: Project[] = (data || []).map(project => ({
        id: project.id,
        name: project.project_name,
        description: project.description || '',
        createdAt: project.created_at
      }));
      
      setProjects(formattedProjects);
      storeProjects(formattedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      handleSupabaseError(error, 'Failed to load projects');
      
      // Use cached projects if available
      const cachedProjects = getCachedProjects();
      if (cachedProjects.length > 0) {
        setProjects(cachedProjects);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getDevices = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await executeWithRetry(
        () => supabase
          .from('devices')
          .select('*')
          .order('created_at', { ascending: false }),
        'Failed to load devices'
      );
      
      if (error) throw error;
      
      const formattedDevices: Device[] = (data || []).map(device => ({
        id: device.id,
        name: device.device_name,
        description: device.description || '',
        projectId: device.project_id,
        createdAt: device.created_at,
        lastSeen: device.last_seen || '',
        isConnected: device.is_connected || false
      }));
      
      setDevices(formattedDevices);
      storeDevices(formattedDevices);
    } catch (error) {
      console.error('Error fetching devices:', error);
      handleSupabaseError(error, 'Failed to load devices');
      
      // Use cached devices if available
      const cachedDevices = getCachedDevices();
      if (cachedDevices.length > 0) {
        setDevices(cachedDevices);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPins = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await executeWithRetry(
        () => supabase
          .from('pin_configs')
          .select(`
            *,
            pins!inner(pin_number, pin_name),
            data_types!inner(name),
            signal_types!inner(name),
            modes!inner(type),
            label(name)
          `)
          .order('created_at', { ascending: false }),
        'Failed to load pins'
      );
      
      if (error) throw error;
      
      const formattedPins: Pin[] = (data || []).map(pin => ({
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
      storePins(formattedPins);
    } catch (error) {
      console.error('Error fetching pins:', error);
      handleSupabaseError(error, 'Failed to load pins');
      
      // Use cached pins if available
      const cachedPins = getCachedPins();
      if (cachedPins.length > 0) {
        setPins(cachedPins);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const getPinsByDevice = (deviceId: string): Pin[] => {
    return pins.filter(pin => pin.deviceId === deviceId);
  };

  const getDevicesByProject = (projectId: string): Device[] => {
    return devices.filter(device => device.projectId === projectId);
  };

  const createProject = async (name: string, description: string): Promise<string> => {
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
      toast({
        title: "Success",
        description: "Project created successfully"
      });
      
      return data[0].id;
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive"
      });
      return '';
    }
  };

  const createDevice = async (name: string, description: string, projectId: string): Promise<string> => {
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
      toast({
        title: "Success",
        description: "Device created successfully"
      });
      
      return data[0].id;
    } catch (error) {
      console.error('Error creating device:', error);
      toast({
        title: "Error",
        description: "Failed to create device",
        variant: "destructive"
      });
      return '';
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
      const { data: pinData, error: pinError } = await supabase
        .from('pins')
        .select('id')
        .eq('pin_number', pinNumber)
        .single();
      
      if (pinError) throw pinError;
      
      const pinId = pinData.id;
      
      const { data: dataTypeData, error: dataTypeError } = await supabase
        .from('data_types')
        .select('id')
        .eq('name', dataType)
        .single();
      
      if (dataTypeError) throw dataTypeError;
      
      const dataTypeId = dataTypeData.id;
      
      const { data: signalTypeData, error: signalTypeError } = await supabase
        .from('signal_types')
        .select('id')
        .eq('name', signalType)
        .single();
      
      if (signalTypeError) throw signalTypeError;
      
      const signalTypeId = signalTypeData.id;
      
      const { data: modeData, error: modeError } = await supabase
        .from('modes')
        .select('id')
        .eq('type', mode)
        .single();
      
      if (modeError) throw modeError;
      
      const modeId = modeData.id;
      
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
      toast({
        title: "Success",
        description: "Pin created successfully"
      });
    } catch (error) {
      console.error('Error creating pin:', error);
      toast({
        title: "Error",
        description: "Failed to create pin",
        variant: "destructive"
      });
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
      
      toast({
        title: "Success",
        description: "Project updated successfully"
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive"
      });
    }
  };

  const updateDevice = async (deviceId: string, updates: Partial<Device>) => {
    try {
      const supabaseUpdates: any = {};
      
      if (updates.name) supabaseUpdates.device_name = updates.name;
      if (updates.description !== undefined) supabaseUpdates.description = updates.description;
      if (updates.isConnected !== undefined) supabaseUpdates.is_connected = updates.isConnected;
      if (updates.lastSeen !== undefined) supabaseUpdates.last_seen = updates.lastSeen;
      if (updates.wifiConfig) {
        supabaseUpdates.wifi_config = updates.wifiConfig;
      }
      if (updates.type) {
        supabaseUpdates.type = updates.type;
      }
      
      const { error } = await supabase
        .from('devices')
        .update(supabaseUpdates)
        .eq('id', deviceId);
      
      if (error) throw error;
      
      setDevices(prev => prev.map(device => 
        device.id === deviceId ? { ...device, ...updates } : device
      ));
      
      toast({
        title: "Success",
        description: "Device updated successfully"
      });
    } catch (error) {
      console.error('Error updating device:', error);
      toast({
        title: "Error",
        description: "Failed to update device",
        variant: "destructive"
      });
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
      
      toast({
        title: "Success",
        description: "Project deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive"
      });
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
      
      toast({
        title: "Success",
        description: "Device deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting device:', error);
      toast({
        title: "Error",
        description: "Failed to delete device",
        variant: "destructive"
      });
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
      
      toast({
        title: "Success",
        description: "Pin deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting pin:', error);
      toast({
        title: "Error",
        description: "Failed to delete pin",
        variant: "destructive"
      });
    }
  };

  const updatePin = async (pinId: string, updates: Partial<Pin>): Promise<void> => {
    try {
      const supabaseUpdates: any = {};
      
      if (updates.name !== undefined) supabaseUpdates.name = updates.name;
      if (updates.value !== undefined) supabaseUpdates.value = updates.value;
      
      const { error } = await supabase
        .from('pin_configs')
        .update(supabaseUpdates)
        .eq('id', pinId);
        
      if (error) {
        throw error;
      }
      
      setPins(prev => prev.map(pin => 
        pin.id === pinId ? { ...pin, ...updates } : pin
      ));
      
      toast({
        title: "Success",
        description: "Pin updated successfully"
      });
    } catch (error) {
      console.error('Error updating pin:', error);
      toast({
        title: "Error",
        description: "Failed to update pin",
        variant: "destructive"
      });
      throw error;
    }
  };

  const togglePinValue = async (pinId: string) => {
    try {
      const pin = pins.find(p => p.id === pinId);
      if (!pin) {
        throw new Error('Pin not found');
      }
      
      const currentValue = pin.value || '0';
      const newValue = currentValue === '1' ? '0' : '1';
      
      const { error } = await supabase
        .from('pin_configs')
        .update({ value: newValue })
        .eq('id', pinId);
      
      if (error) throw error;
      
      const { error: historyError } = await supabase
        .from('pin_data')
        .insert({ pin_config_id: pinId, value: newValue });
        
      if (historyError) {
        console.error('Failed to record pin history:', historyError);
      }
      
      setPins(prev => prev.map(pin => 
        pin.id === pinId ? { ...pin, value: newValue } : pin
      ));
      
      toast({
        title: "Success",
        description: `${pin.name} turned ${newValue === '1' ? 'on' : 'off'}`
      });
    } catch (error) {
      console.error('Error toggling pin value:', error);
      toast({
        title: "Error",
        description: "Failed to toggle pin value",
        variant: "destructive"
      });
    }
  };

  const generateDeviceCode = async (deviceId: string): Promise<string> => {
    console.log('generateDeviceCode called with deviceId:', deviceId);
    return 'DEVICE_CODE_PLACEHOLDER';
  };

  const updateDeviceConnection = async (deviceId: string, isConnected: boolean): Promise<void> => {
    console.log('updateDeviceConnection called with:', deviceId, isConnected);
    await updateDevice(deviceId, { isConnected });
  };

  // Fix configurePin function to match expected signature
  const configurePin = async (deviceId: string, config: any): Promise<void> => {
    try {
      const { pinId, dataType, signalType, mode, name, label } = config;
      
      const { data: dataTypeData, error: dataTypeError } = await supabase
        .from('data_types')
        .select('id')
        .eq('name', dataType)
        .single();
      
      if (dataTypeError) throw dataTypeError;
      const dataTypeId = dataTypeData.id;
      
      const { data: signalTypeData, error: signalTypeError } = await supabase
        .from('signal_types')
        .select('id')
        .eq('name', signalType)
        .single();
      
      if (signalTypeError) throw signalTypeError;
      const signalTypeId = signalTypeData.id;
      
      const { data: modeData, error: modeError } = await supabase
        .from('modes')
        .select('id')
        .eq('type', mode)
        .single();
      
      if (modeError) throw modeError;
      const modeId = modeData.id;
      
      let labelId = null;
      if (label && label.trim() !== '') {
        const { data: labelData, error: labelError } = await supabase
          .from('label')
          .select('id')
          .eq('name', label)
          .single();
        
        if (!labelError) {
          labelId = labelData.id;
        } else {
          const { data: newLabelData, error: newLabelError } = await supabase
            .from('label')
            .insert({ name: label })
            .select('id')
            .single();
          
          if (!newLabelError && newLabelData) {
            labelId = newLabelData.id;
          }
        }
      }
      
      const { data: pinConfigData, error: configError } = await supabase
        .from('pin_configs')
        .insert({
          name,
          device_id: deviceId,
          pin_id: pinId,
          data_type_id: dataTypeId,
          signal_type_id: signalTypeId,
          mode_id: modeId,
          label_id: labelId,
        })
        .select(`
          *,
          pins!inner(pin_number, pin_name),
          data_types!inner(name),
          signal_types!inner(name),
          modes!inner(type),
          label(name)
        `)
        .single();
      
      if (configError) throw configError;
      
      if (pinConfigData) {
        const newPin: Pin = {
          id: pinConfigData.id,
          name: pinConfigData.name,
          pinNumber: pinConfigData.pins.pin_number,
          mode: pinConfigData.modes.type as 'input' | 'output',
          signalType: pinConfigData.signal_types.name as Pin['signalType'],
          dataType: pinConfigData.data_types.name as Pin['dataType'],
          unit: pinConfigData.unit || '',
          deviceId: pinConfigData.device_id,
          createdAt: pinConfigData.created_at,
          value: pinConfigData.value || '',
          label: pinConfigData.label?.name || '',
          lastUpdated: pinConfigData.last_updated || ''
        };
        
        setPins(prev => [...prev, newPin]);
        
        // Update offline storage
        const allPins = [...pins, newPin];
        storePins(allPins);
        
        toast({
          title: "Success",
          description: "Pin configured successfully"
        });
      }
    } catch (error) {
      console.error('Error configuring pin:', error);
      handleSupabaseError(error, 'Failed to configure pin');
      
      // Queue the change for later synchronization
      queueChange('create', 'pin', { ...config, deviceId });
      
      throw error;
    }
  };
  
  const getPinOptions = () => {
    try {
      const configuredPins = pins.map(pin => pin.pinNumber);
      
      return [
        { id: 'D0', name: 'D0', pinNumber: 0 },
        { id: 'D1', name: 'D1', pinNumber: 1 },
        { id: 'D2', name: 'D2', pinNumber: 2 },
        { id: 'D3', name: 'D3', pinNumber: 3 },
        { id: 'D4', name: 'D4', pinNumber: 4 },
        { id: 'D5', name: 'D5', pinNumber: 5 },
        { id: 'D6', name: 'D6', pinNumber: 6 },
        { id: 'D7', name: 'D7', pinNumber: 7 },
        { id: 'D8', name: 'D8', pinNumber: 8 },
        { id: 'A0', name: 'A0', pinNumber: 10 }
      ].filter(pin => !configuredPins.includes(pin.pinNumber));
    } catch (error) {
      console.error('Error getting pin options:', error);
      return [];
    }
  };

  const fetchLabels = async (): Promise<string[]> => {
    try {
      const { data, error } = await executeWithRetry(
        () => supabase.from('label').select('name').order('name'),
        'Failed to fetch labels'
      );
      
      if (error) throw error;
      
      return (data || []).map(label => label.name);
    } catch (error) {
      console.error('Error fetching labels:', error);
      return labels;
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
    getDevicesByProject,
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
    generateDeviceCode,
    updateDeviceConnection,
    configurePin,
    pinOptions: getPinOptions(),
    fetchLabels,
  };

  return (
    <HydroContext.Provider value={value}>
      {children}
    </HydroContext.Provider>
  );
};
