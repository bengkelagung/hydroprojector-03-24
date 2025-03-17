
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, QrCode, Scan, Check, Wifi, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';

interface QRScannerProps {
  onConnect: (ssid: string, password: string) => void;
  serverConnected?: boolean;
}

const SERVER_URL = 'http://localhost:3001';
const SOCKET_URL = 'ws://localhost:3001';

// Mock QR codes for testing (simulating Wi-Fi QR codes)
const mockQRData = [
  'WIFI:S:HomeWifi;T:WPA;P:password123;;',
  'WIFI:S:GuestNetwork;T:WPA;P:guest2023;;',
  'WIFI:S:OfficeWifi;T:WPA2;P:office@secure;;',
];

const QRCodeScanner: React.FC<QRScannerProps> = ({ 
  onConnect, 
  serverConnected = false 
}) => {
  const [scanning, setScanning] = useState(false);
  const [connected, setConnected] = useState(false);
  const [wifiCredentials, setWifiCredentials] = useState<{ ssid: string; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const [useMockData, setUseMockData] = useState(!serverConnected);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection for real-time communication
  useEffect(() => {
    if (!useMockData) {
      try {
        const newSocket = io(SOCKET_URL);
        
        newSocket.on('connect', () => {
          console.log('Connected to WebSocket server');
        });
        
        newSocket.on('disconnect', () => {
          console.log('Disconnected from WebSocket server');
        });
        
        newSocket.on('wifi_connected', (data) => {
          setConnected(true);
          setWifiCredentials({
            ssid: data.ssid,
            password: data.password
          });
          toast.success(`Connected to ${data.ssid}`);
          onConnect(data.ssid, data.password);
          stopScanner();
        });
        
        newSocket.on('qr_process_error', (data) => {
          setError(data.error);
          toast.error(`QR code error: ${data.error}`);
        });
        
        setSocket(newSocket);
        
        return () => {
          newSocket.disconnect();
        };
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        toast.error('Failed to connect to WebSocket server. Using mock data instead.');
        setUseMockData(true);
      }
    }
  }, [useMockData, onConnect]);

  // When component unmounts, make sure we clean up
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Process the QR code data
  const processQRCode = async (qrData: string) => {
    setError(null);
    
    if (!qrData.includes('WIFI:S:')) {
      setError('Invalid QR code format. Not a Wi-Fi QR code.');
      toast.error('Invalid QR code format. Not a Wi-Fi QR code.');
      return;
    }
    
    try {
      if (!useMockData && socket) {
        // Send to server for processing via socket
        socket.emit('process_qr_code', { qrData });
      } else {
        // Process locally for demo/mock
        const ssidMatch = qrData.match(/S:(.*?);/);
        const passwordMatch = qrData.match(/P:(.*?);/);
        
        if (!ssidMatch) {
          throw new Error('Invalid QR code format. SSID not found.');
        }
        
        const ssid = ssidMatch[1];
        const password = passwordMatch ? passwordMatch[1] : '';
        
        // Simulate connection delay
        setScanning(false);
        toast.success(`QR code scanned successfully`);
        
        setTimeout(() => {
          setConnected(true);
          setWifiCredentials({ ssid, password });
          toast.success(`Connected to ${ssid}`);
          onConnect(ssid, password);
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error processing QR:', error);
      setError(error.message);
      toast.error(`Failed to process QR code: ${error.message}`);
    }
  };

  // Start the QR scanner
  const startScanner = async () => {
    setScanning(true);
    setError(null);
    
    if (useMockData) {
      // For mock data, simulate scanning delay then pick a random mock QR code
      timeoutRef.current = setTimeout(() => {
        const randomQR = mockQRData[Math.floor(Math.random() * mockQRData.length)];
        processQRCode(randomQR);
      }, 1500);
      return;
    }
    
    try {
      // For real device, access the camera and start scanning
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Start scanning frames
        requestAnimationFrame(scanQRCode);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Failed to access camera. Please check permissions.');
      setScanning(false);
      
      // Fall back to mock data
      toast.error('Camera access failed. Using mock data for demonstration.');
      setUseMockData(true);
      startScanner();
    }
  };

  // Stop the QR scanner
  const stopScanner = () => {
    setScanning(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Scan video frames for QR codes
  const scanQRCode = () => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // In a real app, we would use a QR code scanning library here
      // like jsQR, zxing-js, or instascan to detect and decode QR codes
      // For this demo, we're just simulating QR detection with a timeout
      
      // Simulated QR detection after 2 seconds
      timeoutRef.current = setTimeout(() => {
        // Choose a random mock QR code
        const randomQR = mockQRData[Math.floor(Math.random() * mockQRData.length)];
        processQRCode(randomQR);
      }, 2000);
      
      return;
    }
    
    // Continue scanning
    requestAnimationFrame(scanQRCode);
  };

  const reset = () => {
    setConnected(false);
    setWifiCredentials(null);
    setError(null);
  };

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Wi-Fi QR Code Scanner</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseMockData(!useMockData)}
            className="text-xs"
          >
            {useMockData ? "Use Real Camera" : "Use Mock Data"}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {!serverConnected && !useMockData && (
          <Alert variant="warning" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Cannot connect to Wi-Fi server. Using demo mode for demonstration.
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {connected && wifiCredentials ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                <Check className="h-5 w-5 text-green-600" />
                <span>Wi-Fi configured successfully</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Wifi className="h-4 w-4 text-green-600" />
                <span>
                  <strong>Network:</strong> {wifiCredentials.ssid}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                These credentials will be used for your device configuration.
              </p>
            </div>
            
            <Button variant="outline" onClick={reset}>
              Scan a Different Network
            </Button>
          </div>
        ) : scanning ? (
          <div className="space-y-4">
            <div className="relative aspect-video bg-gray-100 rounded-md overflow-hidden">
              {useMockData ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-hydro-blue mb-4" />
                  <p className="text-gray-600">Scanning for Wi-Fi QR code...</p>
                  <p className="text-xs text-gray-500 mt-2">Demo mode: Simulating scan</p>
                </div>
              ) : (
                <>
                  <video 
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    playsInline
                  />
                  <canvas 
                    ref={canvasRef}
                    className="hidden"
                  />
                  <div className="absolute inset-0 border-2 border-hydro-blue/50 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-hydro-blue"></div>
                  </div>
                </>
              )}
            </div>
            
            <Button 
              onClick={stopScanner} 
              variant="outline"
              className="w-full"
            >
              Cancel Scanning
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center p-6 space-y-4">
            <QrCode className="h-16 w-16 text-hydro-blue mb-2" />
            <h3 className="text-lg font-medium text-center">Scan a Wi-Fi QR Code</h3>
            <p className="text-center text-gray-600 max-w-md">
              Point your camera at a Wi-Fi QR code to connect your device to the network.
              You can generate Wi-Fi QR codes using various apps or websites.
            </p>
            <Button 
              onClick={startScanner}
              className="bg-hydro-blue hover:bg-blue-700 mt-2"
            >
              <Scan className="mr-2 h-4 w-4" />
              Start Scanning
            </Button>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="bg-gray-50 px-6 py-4">
        <p className="text-xs text-gray-500">
          Wi-Fi QR codes typically follow the format: WIFI:S:&lt;SSID&gt;;T:&lt;Authentication&gt;;P:&lt;Password&gt;;;
        </p>
      </CardFooter>
    </Card>
  );
};

export default QRCodeScanner;
