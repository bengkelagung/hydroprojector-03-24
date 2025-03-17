
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, InfoIcon, Check, ChevronRight, Upload, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useHydro } from '@/contexts/HydroContext';
import QRCodeScanner from '@/components/QRCodeScanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DeviceWifiSetup = () => {
  const [wifiSSID, setWifiSSID] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("scan");
  const { devices, updateDevice } = useHydro();
  const navigate = useNavigate();
  const { deviceId } = useParams<{ deviceId: string }>();
  
  // Find the device in our context
  const device = devices.find(d => d.id === deviceId);
  
  // Check for connected device
  useEffect(() => {
    // For real implementation, check for server availability
    const checkDeviceConnection = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/scan-wifi', { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
          setDeviceConnected(true);
        } else {
          setDeviceConnected(false);
        }
      } catch (error) {
        console.error('Error checking device connection:', error);
        setDeviceConnected(false);
      }
    };
    
    checkDeviceConnection();
  }, []);

  // If device already has WiFi config, use it
  useEffect(() => {
    if (device?.wifiConfig) {
      setWifiSSID(device.wifiConfig.wifiSSID);
      if (device.wifiConfig.wifiPassword) {
        setWifiPassword(device.wifiConfig.wifiPassword);
      }
    }
  }, [device]);

  const handleWifiConnect = (ssid: string, password: string) => {
    setWifiSSID(ssid);
    setWifiPassword(password);
    toast.success(`Wi-Fi credentials saved: ${ssid}`);
  };

  const handleManualWifiInput = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const ssid = formData.get('ssid') as string;
    const password = formData.get('password') as string;
    
    if (!ssid) {
      toast.error('Wi-Fi SSID is required');
      return;
    }
    
    handleWifiConnect(ssid, password);
  };

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (!event.target?.result) return;
      
      try {
        // In a real implementation, we'd use a QR code scanning library here
        // For now we'll just simulate a successful scan
        toast.success('Processing QR code from image...');
        
        // Simulate processing delay
        setTimeout(() => {
          // For demo purposes, extract a fake SSID from the filename
          const fakeSSID = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '');
          handleWifiConnect(fakeSSID || 'HomeNetwork', 'password123');
        }, 1500);
      } catch (error) {
        console.error('Error processing QR code image:', error);
        toast.error('Failed to process QR code from image');
      }
    };
    
    reader.onerror = () => {
      toast.error('Failed to read the image file');
    };
    
    reader.readAsDataURL(file);
  };

  const handleSaveWifiConfig = async () => {
    if (!deviceId || !wifiSSID) {
      toast.error('Device ID or WiFi SSID is missing');
      return;
    }

    try {
      setIsConfiguring(true);
      
      // Update device with WiFi configuration
      await updateDevice(deviceId, {
        wifiConfig: {
          wifiSSID,
          wifiPassword
        }
      });
      
      toast.success('WiFi configuration saved successfully!');
      navigate(`/devices/${deviceId}/code`);
    } catch (error) {
      console.error('Error saving WiFi configuration:', error);
      toast.error('Failed to save WiFi configuration');
    } finally {
      setIsConfiguring(false);
    }
  };

  // If device not found
  if (!device) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert className="mb-8 bg-amber-50 border-amber-200">
          <InfoIcon className="h-5 w-5 text-amber-500" />
          <AlertTitle className="text-amber-800">Device not found</AlertTitle>
          <AlertDescription className="text-amber-700">
            The device you're trying to configure doesn't exist or has been deleted.
          </AlertDescription>
        </Alert>
        
        <Button
          onClick={() => navigate('/devices')}
          className="bg-hydro-blue hover:bg-blue-700"
        >
          Back to Devices
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Configure Wi-Fi for {device.name}</h1>
        <p className="text-gray-600 mt-2">
          Add Wi-Fi credentials for your {device.type.toUpperCase()} device.
        </p>
      </div>
      
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 bg-hydro-blue text-white rounded-full flex items-center justify-center mb-1">
            <Check className="h-5 w-5" />
          </div>
          <span className="text-xs text-gray-600">Create Device</span>
        </div>
        <div className="h-0.5 flex-1 bg-hydro-blue mx-2"></div>
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 bg-hydro-blue text-white rounded-full flex items-center justify-center mb-1">
            2
          </div>
          <span className="text-xs text-gray-600 font-medium">Configure Wi-Fi</span>
        </div>
        <div className="h-0.5 flex-1 bg-gray-200 mx-2"></div>
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center mb-1">
            3
          </div>
          <span className="text-xs text-gray-500">Get Code</span>
        </div>
      </div>
      
      {/* Tabs for different options */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="scan" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            <span>Scan QR</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span>Upload Image</span>
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <InfoIcon className="h-4 w-4" />
            <span>Manual Entry</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="scan" className="p-0 border-0">
          <QRCodeScanner 
            onConnect={handleWifiConnect} 
            serverConnected={deviceConnected}
            useMockData={false} 
          />
        </TabsContent>
        
        <TabsContent value="upload" className="border rounded-lg p-6 bg-white mb-4">
          <div className="flex flex-col items-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
              <Upload className="h-8 w-8 text-hydro-blue" />
            </div>
            
            <h3 className="text-lg font-medium">Upload QR Code Image</h3>
            <p className="text-center text-gray-600 max-w-md">
              Select a QR code image from your device to extract Wi-Fi credentials.
            </p>
            
            <div className="w-full">
              <label className="flex flex-col items-center px-4 py-6 bg-blue-50 text-blue rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors">
                <Upload className="w-8 h-8 text-hydro-blue" />
                <span className="mt-2 text-base text-hydro-blue">Select image file</span>
                <Input 
                  type="file" 
                  accept="image/*"
                  className="hidden" 
                  onChange={handleLocalImageUpload}
                />
              </label>
            </div>
            
            <p className="text-xs text-gray-500">
              Supported formats: JPG, PNG, GIF
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="manual" className="border rounded-lg p-6 bg-white mb-4">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Manual Wi-Fi Configuration</h3>
            <p className="text-gray-600">
              Enter your Wi-Fi network credentials manually:
            </p>
            
            <form onSubmit={handleManualWifiInput} className="space-y-4">
              <div>
                <label htmlFor="ssid" className="block text-sm font-medium text-gray-700 mb-1">
                  Wi-Fi SSID (Network Name)
                </label>
                <Input 
                  id="ssid" 
                  name="ssid" 
                  placeholder="Enter Wi-Fi network name" 
                  defaultValue={wifiSSID}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Wi-Fi Password
                </label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  placeholder="Enter Wi-Fi password" 
                  defaultValue={wifiPassword}
                />
              </div>
              
              <Button 
                type="submit"
                className="bg-hydro-blue hover:bg-blue-700 w-full"
              >
                Save Wi-Fi Credentials
              </Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Finish Wi-Fi Setup</CardTitle>
          <CardDescription>
            Review the Wi-Fi settings and continue to get your device code
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {wifiSSID ? (
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h4 className="font-medium text-green-800 flex items-center">
                <Check className="h-4 w-4 mr-1.5 text-green-600" />
                Wi-Fi Configured
              </h4>
              <p className="text-sm text-green-700 mt-1">
                Your device will connect to: <strong>{wifiSSID}</strong>
              </p>
              <p className="text-xs text-green-600 mt-1">
                These credentials will be embedded in your device code.
              </p>
            </div>
          ) : (
            <Alert className="bg-amber-50 border-amber-200">
              <InfoIcon className="h-5 w-5 text-amber-500" />
              <AlertDescription className="text-amber-700">
                Please add Wi-Fi credentials to continue.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline"
            onClick={() => navigate('/devices')}
          >
            Cancel
          </Button>
          <Button
            className="bg-hydro-blue hover:bg-blue-700"
            disabled={!wifiSSID || isConfiguring}
            onClick={handleSaveWifiConfig}
          >
            {isConfiguring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue to Device Code
                <ChevronRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DeviceWifiSetup;
