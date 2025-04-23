
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Cpu } from 'lucide-react';
import { toast } from 'sonner';
import { useHydro } from '@/contexts/HydroContext';

// Import components
import DeviceSetupProgress from '@/components/device/DeviceSetupProgress';
import DeviceCodeCard from '@/components/device/DeviceCodeCard';
import DeviceInfoCard from '@/components/device/DeviceInfoCard';
import DeviceNotFound from '@/components/device/DeviceNotFound';

// Import utilities
import { generateDeviceCodeWithConfig } from '@/utils/deviceCodeGenerator';

const DeviceCode = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const { devices, updateDeviceConnection, getPinsByDevice } = useHydro();
  const [device, setDevice] = useState(devices.find(d => d.id === deviceId) || null);
  const [code, setCode] = useState('');
  const [devicePins, setDevicePins] = useState([]);

  useEffect(() => {
    const foundDevice = devices.find(d => d.id === deviceId) || null;
    setDevice(foundDevice);
    
    if (foundDevice) {
      // Get configured pins for this device
      const configuredPins = getPinsByDevice(foundDevice.id);
      setDevicePins(configuredPins);
      
      try {
        // Generate code with device data including WiFi and pins
        const generatedCode = generateDeviceCodeWithConfig(foundDevice, configuredPins);
        setCode(generatedCode);
      } catch (error) {
        console.error('Error generating code:', error);
        toast.error('Error generating device code');
      }
    }
  }, [deviceId, devices, getPinsByDevice]);

  const simulateDeviceConnection = () => {
    updateDeviceConnection(device.id, true);
    toast.success('Device connected successfully!');
  };

  if (!device) {
    return <DeviceNotFound />;
  }

  const hasWifiConfig = device.wifiConfig && Boolean(device.wifiConfig.wifiSSID);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Device Code for {device.name}</h1>
        <p className="text-gray-600 mt-2">
          Upload this code to your {device.type.toUpperCase()} to connect it to your hydroponics system.
        </p>
      </div>
      
      <DeviceSetupProgress />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <DeviceCodeCard 
            device={device} 
            code={code} 
            hasWifiConfig={Boolean(hasWifiConfig)}
            simulateDeviceConnection={simulateDeviceConnection}
          />
        </div>
        
        <div className="lg:col-span-1">
          <DeviceInfoCard 
            device={device} 
            hasWifiConfig={Boolean(hasWifiConfig)} 
          />
        </div>
      </div>
    </div>
  );
};

export default DeviceCode;
