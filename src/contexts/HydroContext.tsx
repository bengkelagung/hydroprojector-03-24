import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from './AuthContext';
import { useSessionRefresh } from '@/hooks/use-session-refresh';
import { 
  supabase, 
  checkTablesExist, 
  checkLabelColumnExists,
  getAvailableLabels
} from '@/integrations/supabase/client';

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface Device {
  id: string;
  name: string;
  description: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  isConnected: boolean;
  lastSeen: string | null;
}

export interface Pin {
  id: string;
  deviceId: string;
  pinNumber: number;
  name: string;
  mode: 'input' | 'output';
  signalType: string;
  dataType: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  label?: string;
  value?: string;
  unit?: string;
}

interface HydroContextType {
  projects: Project[];
  devices: Device[];
  pins: Pin[];
  selectedDeviceId: string | null;
  availablePinNumbers: number[];
  signalTypes: string[];
  dataTypes: string[];
  pinModes: string[];
  labels: string[];
  hasLabelColumn: boolean;
  tablesChecked: boolean;
  
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  
  createDevice: (device: Omit<Device, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'isConnected' | 'lastSeen'>) => Promise<void>;
  updateDevice: (deviceId: string, updates: Partial<Device>) => Promise<void>;
  deleteDevice: (deviceId: string) => Promise<void>;
  
  createPin: (pin: Omit<Pin, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'value' | 'unit'>) => Promise<void>;
  updatePin: (pinId: string, updates: Partial<Pin>) => Promise<void>;
  deletePin: (pinId: string) => Promise<void>;
  togglePinValue: (pinId: string) => Promise<void>;
  
  getDevicesByProject: (projectId: string) => Device[];
  getPinsByDevice: (deviceId: string) => Pin[];
  
  setSelectedDeviceId: (deviceId: string | null) => void;
  updateAvailablePinOptions: (deviceId: string) => Promise<void>;
  
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
  setPins: React.Dispatch<React.SetStateAction<Pin[]>>;
}

export const HydroContext = createContext<HydroContextType>({
  projects: [],
  devices: [],
  pins: [],
  selectedDeviceId: null,
  availablePinNumbers: [],
  signalTypes: ['general', 'pH', 'temperature', 'humidity', 'water-level', 'nutrient', 'light'],
  dataTypes: ['analog', 'digital', 'boolean', 'string', 'float', 'integer'],
  pinModes: ['input', 'output'],
  labels: [],
  hasLabelColumn: false,
  tablesChecked: false,
  
  createProject: () => Promise.resolve(),
  updateProject: () => Promise.resolve(),
  deleteProject: () => Promise.resolve(),
  
  createDevice: () => Promise.resolve(),
  updateDevice: () => Promise.resolve(),
  deleteDevice: () => Promise.resolve(),
  
  createPin: () => Promise.resolve(),
  updatePin: () => Promise.resolve(),
  deletePin: () => Promise.resolve(),
  togglePinValue: () => Promise.resolve(),
  
  getDevicesByProject: () => [],
  getPinsByDevice: () => [],
  
  setSelectedDeviceId: () => {},
  updateAvailablePinOptions: () => Promise.resolve(),
  
  setProjects: () => {},
  setDevices: () => {},
  setPins: () => {},
});

export const HydroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshSession } = useAuth();
  const { withSessionRefresh } = useSessionRefresh();
  const [projects, setProjects] = useState<Project[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [availablePinNumbers, setAvailablePinNumbers] = useState<number[]>([]);
  const [signalTypes, setSignalTypes] = useState<string[]>(['general', 'pH', 'temperature', 'humidity', 'water-level', 'nutrient', 'light']);
  const [dataTypes, setDataTypes] = useState<string[]>(['analog', 'digital', 'boolean', 'string', 'float', 'integer']);
  const [pinModes, setPinModes] = useState<string[]>(['input', 'output']);
  const [labels, setLabels] = useState<string[]>([]);
  const [hasLabelColumn, setHasLabelColumn] = useState<boolean>(false);
  const [tablesChecked, setTablesChecked] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkTables = async () => {
      try {
        const tablesToCheck = ['projects', 'devices', 'pins', 'pin_history'];
        const result = await withSessionRefresh(() => checkTablesExist());
        
        if (result) {
          console.log('Tables exist');
          setTablesChecked(true);
          
          try {
            const hasLabelCol = await withSessionRefresh(() => checkLabelColumnExists());
            setHasLabelColumn(hasLabelCol || false);
            
            if (hasLabelCol) {
              try {
                const fetchedLabels = await withSessionRefresh(() => getAvailableLabels());
                setLabels(fetchedLabels || []);
              } catch (error) {
                console.error('Error fetching labels:', error);
              }
            }
          } catch (error) {
            console.error('Error checking label column:', error);
          }
        } else {
          console.log('Tables do not exist');
          setTablesChecked(false);
        }
      } catch (error) {
        console.error('Error checking tables:', error);
      }
    };
    
    checkTables();
  }, [toast, withSessionRefresh]);

  const updateAvailablePinOptions = async (deviceId: string) => {
    try {
      const usedPinNumbers = pins
        .filter((pin) => pin.deviceId === deviceId)
        .map((pin) => pin.pinNumber);
      
      // Assuming pin numbers can range from 0 to 35 (adjust as necessary)
      const allPossiblePinNumbers = Array.from({ length: 36 }, (_, i) => i);
      
      const availablePinOptions = allPossiblePinNumbers.filter(
        (pinNumber) => !usedPinNumbers.includes(pinNumber)
      );
      
      setAvailablePinNumbers(availablePinOptions);
    } catch (error) {
      console.error("Error updating available pin options:", error);
    }
  };

  const createProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<void> => {
    try {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('projects')
        .insert([{ ...project, userId: user.id }])
        .select()
        .single();

      if (error) throw error;

      setProjects((prevProjects) => [...prevProjects, data]);
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  };

  const updateProject = async (projectId: string, updates: Partial<Project>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);

      if (error) throw error;

      setProjects((prevProjects) =>
        prevProjects.map((project) => (project.id === projectId ? { ...project, ...updates } : project))
      );
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  };

  const deleteProject = async (projectId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects((prevProjects) => prevProjects.filter((project) => project.id !== projectId));
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  };

  const createDevice = async (device: Omit<Device, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'isConnected' | 'lastSeen'>): Promise<void> => {
    try {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('devices')
        .insert([{ ...device, userId: user.id }])
        .select()
        .single();

      if (error) throw error;

      setDevices((prevDevices) => [...prevDevices, data]);
    } catch (error) {
      console.error("Error creating device:", error);
      throw error;
    }
  };

  const updateDevice = async (deviceId: string, updates: Partial<Device>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('devices')
        .update(updates)
        .eq('id', deviceId);

      if (error) throw error;

      setDevices((prevDevices) =>
        prevDevices.map((device) => (device.id === deviceId ? { ...device, ...updates } : device))
      );
    } catch (error) {
      console.error("Error updating device:", error);
      throw error;
    }
  };

  const deleteDevice = async (deviceId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', deviceId);

      if (error) throw error;

      setDevices((prevDevices) => prevDevices.filter((device) => device.id !== deviceId));
    } catch (error) {
      console.error("Error deleting device:", error);
      throw error;
    }
  };

  const createPin = async (pin: Omit<Pin, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'value' | 'unit'>): Promise<void> => {
    try {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('pins')
        .insert([{ ...pin, userId: user.id }])
        .select()
        .single();

      if (error) throw error;

      setPins((prevPins) => [...prevPins, data]);
    } catch (error) {
      console.error("Error creating pin:", error);
      throw error;
    }
  };

  const updatePin = async (pinId: string, updates: Partial<Pin>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('pins')
        .update(updates)
        .eq('id', pinId);

      if (error) throw error;

      setPins((prevPins) =>
        prevPins.map((pin) => (pin.id === pinId ? { ...pin, ...updates } : pin))
      );

      return Promise.resolve();
    } catch (error) {
      console.error('Error updating pin:', error);
      throw error;
    }
  };

  const deletePin = async (pinId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('pins')
        .delete()
        .eq('id', pinId);

      if (error) throw error;

      setPins((prevPins) => prevPins.filter((pin) => pin.id !== pinId));
    } catch (error) {
      console.error("Error deleting pin:", error);
      throw error;
    }
  };
  
  const togglePinValue = async (pinId: string): Promise<void> => {
    try {
      const pin = pins.find(p => p.id === pinId);
      if (!pin) throw new Error("Pin not found");
      
      const newValue = pin.value === '1' ? '0' : '1';
      
      const { error } = await supabase
        .from('pins')
        .update({ value: newValue })
        .eq('id', pinId);
        
      if (error) throw error;
      
      setPins(prevPins => 
        prevPins.map(p => (p.id === pinId ? { ...p, value: newValue } : p))
      );
    } catch (error) {
      console.error("Error toggling pin value:", error);
      throw error;
    }
  };

  const getDevicesByProject = (projectId: string): Device[] => {
    return devices.filter((device) => device.projectId === projectId);
  };

  const getPinsByDevice = (deviceId: string): Pin[] => {
    return pins.filter((pin) => pin.deviceId === deviceId);
  };

  useEffect(() => {
    if (selectedDeviceId) {
      updateAvailablePinOptions(selectedDeviceId);
    }
  }, [selectedDeviceId, pins]);
  
  useEffect(() => {
    const handleRealtimeChanges = () => {
      supabase
        .channel('any')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'devices' },
          (payload) => {
            if (payload.eventType === 'UPDATE') {
              const updatedDevice = payload.new as Device;
              setDevices((prevDevices) =>
                prevDevices.map((device) =>
                  device.id === updatedDevice.id ? updatedDevice : device
                )
              );
            }
          }
        )
        .subscribe()
    }
    handleRealtimeChanges()
  }, [])

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setDevices([]);
      setPins([]);
      return;
    }

    const fetchInitialData = async () => {
      try {
        // Fetch projects
        const { data: projectsData, error: projectsError } = await withSessionRefresh(() =>
          supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false })
        ) as { data: Project[] | null, error: any };

        if (projectsError) throw projectsError;
        setProjects(projectsData || []);

        // Fetch devices
        const { data: devicesData, error: devicesError } = await withSessionRefresh(() =>
          supabase
            .from('devices')
            .select('*')
            .order('created_at', { ascending: false })
        ) as { data: Device[] | null, error: any };

        if (devicesError) throw devicesError;
        setDevices(devicesData || []);

        // Fetch pins
        const { data: pinsData, error: pinsError } = await withSessionRefresh(() =>
          supabase
            .from('pins')
            .select('*')
            .order('created_at', { ascending: false })
        ) as { data: Pin[] | null, error: any };

        if (pinsError) throw pinsError;
        setPins(pinsData || []);
        
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    
    fetchInitialData();
  }, [user, withSessionRefresh]);
  
  const contextValue: HydroContextType = {
    projects,
    devices,
    pins,
    selectedDeviceId,
    availablePinNumbers,
    signalTypes,
    dataTypes,
    pinModes,
    labels,
    hasLabelColumn,
    tablesChecked,
    
    createProject,
    updateProject,
    deleteProject,
    
    createDevice,
    updateDevice,
    deleteDevice,
    
    createPin,
    updatePin,
    deletePin,
    togglePinValue,
    
    getDevicesByProject,
    getPinsByDevice,
    
    setSelectedDeviceId,
    updateAvailablePinOptions,
    
    setProjects,
    setDevices,
    setPins,
  };
  
  return (
    <HydroContext.Provider
      value={contextValue}
    >
      {children}
    </HydroContext.Provider>
  );
};

export const useHydro = () => {
  const context = useContext(HydroContext);
  if (context === undefined) {
    throw new Error('useHydro must be used within a HydroProvider');
  }
  return context;
};
