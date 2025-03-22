
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, Wifi, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface DeviceCodeCardProps {
  device: any;
  code: string;
  hasWifiConfig: boolean;
  simulateDeviceConnection: () => void;
}

const DeviceCodeCard: React.FC<DeviceCodeCardProps> = ({ 
  device, 
  code, 
  hasWifiConfig,
  simulateDeviceConnection
}) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied to clipboard');
    
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  return (
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
              Wi-Fi credentials are pre-configured in the code:&nbsp;
              <code className="px-1 py-0.5 bg-blue-100 rounded ml-1">{device.wifiConfig.wifiSSID}</code>
              {device.wifiConfig.wifiPassword && (
                <>
                  &nbsp;with password:&nbsp;
                  <code className="px-1 py-0.5 bg-blue-100 rounded">{device.wifiConfig.wifiPassword}</code>
                </>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="w-full">
            <Alert className="bg-amber-50 border-amber-200 mb-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <AlertDescription className="text-gray-700">
                No Wi-Fi configuration found. You'll need to set up Wi-Fi for this device.
              </AlertDescription>
            </Alert>
            <Link to={`/devices/${device.id}/wifi-setup`}>
              <Button 
                variant="outline" 
                className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                <Wifi className="mr-2 h-4 w-4" />
                Configure Wi-Fi
              </Button>
            </Link>
          </div>
        )}
        
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
  );
};

export default DeviceCodeCard;
