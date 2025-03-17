
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wifi, WifiOff, Lock, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Mock data for available networks - in a real app, this would come from the device
interface WifiNetwork {
  ssid: string;
  signal: number; // 0-100
  secure: boolean;
}

// This would be replaced with actual API calls to the device
const mockNetworks: WifiNetwork[] = [
  { ssid: 'HomeWifi', signal: 90, secure: true },
  { ssid: 'Neighbor5G', signal: 70, secure: true },
  { ssid: 'CoffeeShop', signal: 50, secure: false },
  { ssid: 'GuestNetwork', signal: 30, secure: false },
];

interface WifiManagerProps {
  onConnect?: (ssid: string, password: string) => void;
}

const WifiManager: React.FC<WifiManagerProps> = ({ onConnect }) => {
  const [networks, setNetworks] = useState<WifiNetwork[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<WifiNetwork | null>(null);
  const [password, setPassword] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Simulate scanning for networks
  const scanNetworks = async () => {
    setIsScanning(true);
    setNetworks([]);
    
    // Simulate API delay
    setTimeout(() => {
      // In a real implementation, this would call an API to scan for networks
      setNetworks(mockNetworks.sort((a, b) => b.signal - a.signal));
      setIsScanning(false);
    }, 2000);
  };

  // Initial scan when component mounts
  useEffect(() => {
    scanNetworks();
  }, []);

  const handleNetworkSelect = (network: WifiNetwork) => {
    setSelectedNetwork(network);
    setPassword('');
  };

  const handleConnect = async () => {
    if (!selectedNetwork) return;
    
    if (selectedNetwork.secure && !password) {
      toast.error("Password is required for this network");
      return;
    }
    
    setIsConnecting(true);
    
    // Simulate connection process
    setTimeout(() => {
      setIsConnecting(false);
      
      // In a real app, this would attempt to connect to the Wi-Fi network
      toast.success(`Connected to ${selectedNetwork.ssid}`);
      
      // Call the onConnect callback with the network details
      if (onConnect) {
        onConnect(selectedNetwork.ssid, password);
      }
    }, 3000);
  };

  // Get appropriate icon for signal strength
  const getSignalIcon = (signal: number) => {
    if (signal >= 70) return <Wifi className="h-4 w-4 text-green-500" />;
    if (signal >= 40) return <Wifi className="h-4 w-4 text-yellow-500" />;
    return <Wifi className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Wi-Fi Manager</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={scanNetworks}
          disabled={isScanning}
        >
          {isScanning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Scan Networks
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {selectedNetwork ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-medium">
              {getSignalIcon(selectedNetwork.signal)}
              {selectedNetwork.ssid}
              {selectedNetwork.secure && <Lock className="h-4 w-4 text-blue-500" />}
            </div>
            
            {selectedNetwork.secure && (
              <div className="space-y-2">
                <Label htmlFor="wifi-password">Password</Label>
                <Input
                  id="wifi-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Wi-Fi password"
                />
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedNetwork(null)}
              >
                Back
              </Button>
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="bg-hydro-blue hover:bg-blue-700"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {isScanning ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-hydro-blue mb-2" />
                <p>Scanning for networks...</p>
              </div>
            ) : networks.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 mb-2">Select a Wi-Fi network to connect your device:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {networks.map((network) => (
                    <div
                      key={network.ssid}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-gray-100",
                      )}
                      onClick={() => handleNetworkSelect(network)}
                    >
                      <div className="flex items-center gap-2">
                        {getSignalIcon(network.signal)}
                        <span>{network.ssid}</span>
                        {network.secure && <Lock className="h-4 w-4 text-gray-500" />}
                      </div>
                      <div className="text-xs text-gray-500">
                        {network.signal}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <WifiOff className="h-8 w-8 text-gray-400 mb-2" />
                <p>No networks found</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={scanNetworks}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WifiManager;
