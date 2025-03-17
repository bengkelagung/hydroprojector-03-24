
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Cpu, Copy, Check, Sliders, AlertTriangle, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useHydro } from '@/contexts/HydroContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const DeviceCode = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { devices, generateDeviceCode, updateDeviceConnection } = useHydro();
  const [device, setDevice] = useState(devices.find(d => d.id === deviceId) || null);
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Find the device when component mounts or devices change
  useEffect(() => {
    const foundDevice = devices.find(d => d.id === deviceId) || null;
    setDevice(foundDevice);
    
    if (foundDevice) {
      try {
        const generatedCode = generateDeviceCode(foundDevice.id);
        setCode(generatedCode);
      } catch (error) {
        console.error('Error generating code:', error);
        toast.error('Error generating device code');
      }
    }
  }, [deviceId, devices, generateDeviceCode]);

  // If device not found, show error
  if (!device) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive" className="mb-8">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Device not found. It may have been deleted or you don't have access to it.
          </AlertDescription>
        </Alert>
        
        <Button
          onClick={() => navigate('/dashboard')}
          variant="outline"
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied to clipboard');
    
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  const simulateDeviceConnection = () => {
    updateDeviceConnection(device.id, true);
    toast.success('Device connected successfully!');
  };

  // Check if device has Wi-Fi config
  const hasWifiConfig = device.wifiConfig && device.wifiConfig.wifiSSID;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Device Code for {device.name}</h1>
        <p className="text-gray-600 mt-2">
          Upload this code to your {device.type.toUpperCase()} to connect it to your hydroponics system.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Arduino Code</CardTitle>
              <CardDescription>
                Auto-generated code for your {device.type.toUpperCase()} device
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={copyCode}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
                
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm h-[500px]">
                  <code>{code}</code>
                </pre>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              {hasWifiConfig ? (
                <Alert className="bg-green-50 border-green-200">
                  <Wifi className="h-5 w-5 text-green-600" />
                  <AlertDescription className="text-gray-700">
                    Wi-Fi credentials from QR code are pre-configured in the code:
                    <code className="px-1 py-0.5 bg-blue-100 rounded ml-1">{device.wifiConfig.wifiSSID}</code>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-gray-700">
                    You'll need to modify the WiFi credentials in the code above. Replace 
                    <code className="px-1 py-0.5 bg-blue-100 rounded">"YOUR_WIFI_SSID"</code> and 
                    <code className="px-1 py-0.5 bg-blue-100 rounded">"YOUR_WIFI_PASSWORD"</code> with your actual WiFi details.
                  </AlertDescription>
                </Alert>
              )}
              
              {/* For demo purposes only */}
              <div className="w-full bg-yellow-50 p-3 rounded-md border border-yellow-200 text-sm text-yellow-800">
                <h4 className="font-medium flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1.5" />
                  Demo Mode
                </h4>
                <p className="mt-1">
                  In a real application, you would upload this code to your physical ESP32 device.
                  For this demo, you can simulate a device connection instead:
                </p>
                <Button 
                  className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white"
                  onClick={simulateDeviceConnection}
                >
                  Simulate Device Connection
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">1. Upload Code</h3>
                <p className="text-sm text-gray-600">
                  Upload this code to your {device.type.toUpperCase()} using the Arduino IDE or PlatformIO.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">2. Connect Device</h3>
                <p className="text-sm text-gray-600">
                  Power on your device and ensure it connects to your WiFi network.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">3. Configure Pins</h3>
                <p className="text-sm text-gray-600">
                  Set up the pins on your device for sensors and actuators.
                </p>
              </div>
            </CardContent>
            
            <CardFooter>
              <Link to={`/devices/${device.id}/config`} className="w-full">
                <Button className="w-full bg-hydro-green hover:bg-green-700">
                  <Sliders className="mr-2 h-4 w-4" />
                  Configure Device
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DeviceCode;
