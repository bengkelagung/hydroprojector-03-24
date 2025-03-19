import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, InfoIcon, Check, ChevronRight, Upload, Camera, Wifi as WifiIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useHydro } from '@/contexts/HydroContext';
import QRCodeScanner from '@/components/QRCodeScanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import jsQR from 'jsqr';

const DeviceWifiSetup = () => {
  const [wifiSSID, setWifiSSID] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("scan");
  const [processingImage, setProcessingImage] = useState(false);
  const { devices, updateDevice } = useHydro();
  const navigate = useNavigate();
  const { deviceId } = useParams<{ deviceId: string }>();
  
  const device = devices.find(d => d.id === deviceId);
  
  useEffect(() => {
    setDeviceConnected(true);
  }, []);

  useEffect(() => {
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
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    setProcessingImage(true);
    toast.info('Processing QR code from image...');
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (!event.target?.result) {
        setProcessingImage(false);
        toast.error('Failed to read image data');
        return;
      }
      
      try {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            setProcessingImage(false);
            toast.error('Failed to process image');
            return;
          }
          
          canvas.width = img.width;
          canvas.height = img.height;
          
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          
          if (code) {
            console.log("QR Code found in image:", code.data);
            if (code.data.includes('WIFI:S:')) {
              const ssidMatch = code.data.match(/S:(.*?);/);
              const passwordMatch = code.data.match(/P:(.*?);/);
              
              if (ssidMatch) {
                const ssid = ssidMatch[1];
                const password = passwordMatch ? passwordMatch[1] : '';
                
                handleWifiConnect(ssid, password);
                toast.success(`Found Wi-Fi: ${ssid}`);
              } else {
                toast.error('Found QR code but SSID information is missing');
              }
            } else {
              toast.error('Found QR code but it is not a Wi-Fi QR code');
            }
          } else {
            toast.error('No QR code found in this image');
          }
          
          setProcessingImage(false);
        };
        
        img.onerror = () => {
          setProcessingImage(false);
          toast.error('Failed to load image');
        };
        
        img.src = event.target.result as string;
      } catch (error) {
        console.error('Error processing QR code from image:', error);
        toast.error('Failed to process QR code from image');
        setProcessingImage(false);
      }
    };
    
    reader.onerror = () => {
      toast.error('Failed to read the image file');
      setProcessingImage(false);
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
                  disabled={processingImage}
                />
              </label>
            </div>
            
            {processingImage && (
              <div className="flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-hydro-blue mr-2" />
                <span>Processing image...</span>
              </div>
            )}
            
            {wifiSSID && activeTab === "upload" && (
              <div className="w-full p-4 bg-green-50 border border-green-200 rounded-md mt-2">
                <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Wi-Fi credentials detected</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <WifiIcon className="h-4 w-4 text-green-600" />
                  <span>
                    <strong>Network:</strong> {wifiSSID}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 mt-1">
                  <span>
                    <strong>Password:</strong> {wifiPassword}
                  </span>
                </div>
              </div>
            )}
            
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
                  value={wifiSSID}
                  onChange={(e) => setWifiSSID(e.target.value)}
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
                  type="text" 
                  placeholder="Enter Wi-Fi password" 
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
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
              <p className="text-sm text-green-700 mt-1">
                Password: <strong>{wifiPassword}</strong>
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
