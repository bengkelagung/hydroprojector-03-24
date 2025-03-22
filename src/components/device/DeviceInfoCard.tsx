
import React from 'react';
import { Link } from 'react-router-dom';
import { Sliders, Wifi, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DeviceInfoCardProps {
  device: any;
  hasWifiConfig: boolean;
}

const DeviceInfoCard: React.FC<DeviceInfoCardProps> = ({ device, hasWifiConfig }) => {
  return (
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
        
        {!hasWifiConfig && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <AlertDescription className="text-gray-700">
              No Wi-Fi configuration found. Configure WiFi before using this device.
            </AlertDescription>
          </Alert>
        )}
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
  );
};

export default DeviceInfoCard;
