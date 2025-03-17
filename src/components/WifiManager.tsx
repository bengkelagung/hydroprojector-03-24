
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wifi, WifiOff, Lock, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Real WiFi network interface
interface WifiNetwork {
  ssid: string;
  signal: number; // 0-100
  secure: boolean;
}

// Mock data for development/testing when no device connection is available
const mockNetworks: WifiNetwork[] = [
  { ssid: 'HomeWifi', signal: 90, secure: true },
  { ssid: 'Neighbor5G', signal: 70, secure: true },
  { ssid: 'CoffeeShop', signal: 50, secure: false },
  { ssid: 'GuestNetwork', signal: 30, secure: false },
];

interface WifiManagerProps {
  onConnect?: (ssid: string, password: string) => void;
  deviceConnected?: boolean;
}

const WifiManager: React.FC<WifiManagerProps> = ({ 
  onConnect, 
  deviceConnected = false 
}) => {
  const [networks, setNetworks] = useState<WifiNetwork[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<WifiNetwork | null>(null);
  const [password, setPassword] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [useMockData, setUseMockData] = useState(!deviceConnected);

  // Function to scan networks from actual device
  const scanRealNetworks = async () => {
    try {
      setIsScanning(true);
      
      // API endpoint to device for scanning networks
      // This would typically be a REST or WebSocket endpoint provided by your device
      const response = await fetch('/api/device/scan-wifi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // You might need to send device ID or other identifiers
        body: JSON.stringify({ 
          action: 'scan_wifi'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Network scan failed');
      }
      
      const data = await response.json();
      
      // Process and format the network data from the device
      const formattedNetworks: WifiNetwork[] = data.networks.map((network: any) => ({
        ssid: network.ssid,
        signal: network.signal_strength || network.rssi,
        secure: network.secure || network.encryption !== 'none',
      }));
      
      // Sort by signal strength
      setNetworks(formattedNetworks.sort((a, b) => b.signal - a.signal));
    } catch (error) {
      console.error('Error scanning networks:', error);
      toast.error('Failed to scan networks. Using mock data instead.');
      // Fall back to mock data if device scan fails
      setUseMockData(true);
      setNetworks(mockNetworks.sort((a, b) => b.signal - a.signal));
    } finally {
      setIsScanning(false);
    }
  };

  // Function to simulate scanning or use mock data
  const scanMockNetworks = async () => {
    setIsScanning(true);
    setNetworks([]);
    
    // Simulate API delay
    setTimeout(() => {
      setNetworks(mockNetworks.sort((a, b) => b.signal - a.signal));
      setIsScanning(false);
    }, 2000);
  };

  // Combined function to scan networks based on device connection status
  const scanNetworks = async () => {
    if (deviceConnected && !useMockData) {
      await scanRealNetworks();
    } else {
      await scanMockNetworks();
    }
  };

  // Initial scan when component mounts
  useEffect(() => {
    scanNetworks();
  }, [deviceConnected]);

  // Function to connect to selected network on the device
  const connectToRealNetwork = async () => {
    if (!selectedNetwork) return;
    
    try {
      setIsConnecting(true);
      
      // API endpoint to connect device to WiFi
      const response = await fetch('/api/device/connect-wifi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ssid: selectedNetwork.ssid,
          password: password,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to connect to network');
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Connected to ${selectedNetwork.ssid}`);
        // Call the onConnect callback with the network details
        if (onConnect) {
          onConnect(selectedNetwork.ssid, password);
        }
      } else {
        throw new Error(data.message || 'Failed to connect to network');
      }
    } catch (error) {
      console.error('Error connecting to network:', error);
      toast.error(`Failed to connect to ${selectedNetwork.ssid}. Please check the password and try again.`);
    } finally {
      setIsConnecting(false);
    }
  };

  // Simulate connection process for development/testing
  const simulateConnection = () => {
    setIsConnecting(true);
    
    // Simulate connection process
    setTimeout(() => {
      setIsConnecting(false);
      
      toast.success(`Connected to ${selectedNetwork?.ssid}`);
      
      // Call the onConnect callback with the network details
      if (onConnect) {
        onConnect(selectedNetwork?.ssid || '', password);
      }
    }, 3000);
  };

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
    
    if (deviceConnected && !useMockData) {
      await connectToRealNetwork();
    } else {
      simulateConnection();
    }
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
        <div className="flex items-center gap-2">
          {deviceConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUseMockData(!useMockData)}
              className="text-xs"
            >
              {useMockData ? "Use Real Device" : "Use Mock Data"}
            </Button>
          )}
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
        </div>
      </CardHeader>
      <CardContent>
        {!deviceConnected && !useMockData && (
          <div className="bg-amber-50 p-3 rounded-md mb-4 text-sm text-amber-800 border border-amber-200">
            <p>No device is connected. Using mock WiFi data for demonstration.</p>
          </div>
        )}
        
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
                <p className="text-sm text-gray-500 mb-2">
                  {deviceConnected && !useMockData 
                    ? "Real networks detected by your device:" 
                    : "Select a Wi-Fi network to connect your device:"}
                </p>
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
