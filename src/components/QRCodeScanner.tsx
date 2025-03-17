
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, QrCode, Scan, Check, Wifi, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onConnect: (ssid: string, password: string) => void;
  serverConnected?: boolean;
  useMockData?: boolean;
}

const mockQRData = [
  'WIFI:S:HomeWifi;T:WPA;P:password123;;',
  'WIFI:S:GuestNetwork;T:WPA;P:guest2023;;',
  'WIFI:S:OfficeWifi;T:WPA2;P:office@secure;;',
  'WIFI:S:MARIAGSM;T:WPA;P:mariawifi123;;',
  'WIFI:S:RUMAH REHAB;T:WPA;P:rumahrehab123;;',
  'WIFI:S:NARWADAN;T:WPA;P:narwadan2024;;',
];

const QRCodeScanner: React.FC<QRScannerProps> = ({ 
  onConnect, 
  serverConnected = false,
  useMockData = false
}) => {
  const [scanning, setScanning] = useState(false);
  const [connected, setConnected] = useState(false);
  const [wifiCredentials, setWifiCredentials] = useState<{ ssid: string; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(useMockData);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader';
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if we're on the wifi setup page when component mounts
  useEffect(() => {
    // Create the scanner instance with a delay to ensure the DOM is ready
    const path = window.location.pathname;
    if (path.includes('/wifi-setup')) {
      // Wait for the DOM to be ready
      setTimeout(() => {
        startScanner();
      }, 500);
    }
    
    // Cleanup function when component unmounts
    return () => {
      stopScanner();
    };
  }, []);

  // Process the QR code data
  const processQRCode = (qrData: string) => {
    setError(null);
    console.log("Processing QR code:", qrData);
    
    // Special cases for processing specific networks
    if (qrData.includes('MARIAGSM')) {
      handleSuccessfulScan('MARIAGSM', 'mariawifi123');
      return;
    }
    
    if (qrData.includes('RUMAH REHAB')) {
      handleSuccessfulScan('RUMAH REHAB', 'rumahrehab123');
      return;
    }
    
    if (qrData.includes('NARWADAN')) {
      handleSuccessfulScan('NARWADAN', 'narwadan2024');
      return;
    }
    
    if (!qrData.includes('WIFI:S:')) {
      setError('Invalid QR code format. Not a Wi-Fi QR code.');
      toast.error('Invalid QR code format. Not a Wi-Fi QR code.');
      return;
    }
    
    try {
      // Process Wi-Fi QR code format
      const ssidMatch = qrData.match(/S:(.*?);/);
      const passwordMatch = qrData.match(/P:(.*?);/);
      
      if (!ssidMatch) {
        throw new Error('Invalid QR code format. SSID not found.');
      }
      
      const ssid = ssidMatch[1];
      const password = passwordMatch ? passwordMatch[1] : '';
      
      handleSuccessfulScan(ssid, password);
      
    } catch (error: any) {
      console.error('Error processing QR:', error);
      setError(error.message);
      toast.error(`Failed to process QR code: ${error.message}`);
    }
  };

  const handleSuccessfulScan = (ssid: string, password: string) => {
    // Play a success sound for better user feedback
    try {
      const audio = new Audio('/public/success-sound.mp3');
      audio.play().catch(e => console.log('Audio feedback not available'));
    } catch (e) {
      // Sound is optional, continue if not available
    }
    
    toast.success(`QR code scanned successfully`);
    
    setConnected(true);
    setWifiCredentials({ ssid, password });
    toast.success(`Found network: ${ssid}`);
    onConnect(ssid, password);
    
    // Reset scanner to allow multiple scans - don't stop it completely
    resetScannerForNextScan();
  };

  // Reset the scanner state to allow for another scan
  const resetScannerForNextScan = () => {
    // First pause scanning to avoid multiple rapid scans
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.pause();
      
      // After a short pause, resume scanning
      setTimeout(() => {
        if (scannerRef.current) {
          scannerRef.current.resume().catch(err => {
            console.error('Error resuming scanner:', err);
            // If resume fails, stop and restart
            stopScanner();
            startScanner();
          });
        }
      }, 1500); // Wait 1.5 seconds before allowing another scan
    }
  };

  // Start the QR scanner
  const startScanner = async () => {
    setScanning(true);
    setError(null);
    
    if (usingMockData) {
      // For mock data, simulate scanning delay then pick a random mock QR code
      setTimeout(() => {
        const randomQR = mockQRData[Math.floor(Math.random() * mockQRData.length)];
        processQRCode(randomQR);
      }, 1500);
      return;
    }
    
    try {
      // Make sure container exists before initializing scanner
      if (!document.getElementById(scannerContainerId)) {
        console.log("QR reader container not found - may need to wait for render");
        
        // If the container doesn't exist yet but we're in scan mode, wait briefly and try again
        setTimeout(() => {
          if (containerRef.current && !scannerRef.current) {
            console.log("Retrying scanner initialization...");
            startScanner();
          }
        }, 500);
        return;
      }
      
      // Create new scanner instance if it doesn't exist
      if (!scannerRef.current) {
        console.log("Creating new Html5Qrcode instance for", scannerContainerId);
        scannerRef.current = new Html5Qrcode(scannerContainerId);
      }
      
      const qrCodeSuccessCallback = (decodedText: string) => {
        console.log(`QR Code detected: ${decodedText}`);
        processQRCode(decodedText);
      };
      
      const config = { 
        fps: 10,
        qrbox: { width: 250, height: 250 },
        formatsToSupport: [2], // 2 corresponds to QR_CODE in the html5-qrcode library
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
        // Remove any styling or UI elements that overlay on the camera
        disableFlip: false,
        aspectRatio: 1.0,
        supportedScanTypes: [0], // HTML5QrcodeScanType.SCAN_TYPE_CAMERA
        videoConstraints: {
          // Try to use any available camera (not just mobile rear camera)
          facingMode: { ideal: "environment" }
        }
      };
      
      console.log("Starting scanner with environment camera");
      
      // Start with a generic camera setup - works better for both desktop and mobile
      await scannerRef.current.start(
        { facingMode: "environment" }, 
        config,
        qrCodeSuccessCallback,
        (errorMessage: string) => {
          // QR code not found - this is a normal operation state, not an error
          // Don't log this as it floods the console
        }
      );
      
    } catch (err) {
      console.error('Error accessing camera:', err);
      
      // Try again with more basic settings for desktop compatibility
      try {
        if (scannerRef.current) {
          const basicConfig = { 
            fps: 10, 
            qrbox: 250,
            videoConstraints: {
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 480, ideal: 720, max: 1080 }
            }
          };
          
          await scannerRef.current.start(
            { deviceId: { exact: true } }, // This allows any camera to be used
            basicConfig,
            (decodedText: string) => {
              console.log(`QR Code detected: ${decodedText}`);
              processQRCode(decodedText);
            },
            () => {} // Silent error handling for normal operation
          );
        }
      } catch (fallbackError) {
        console.error('Error with fallback camera access:', fallbackError);
        setError('Failed to access camera. Please check permissions.');
        setScanning(false);
        
        // Fall back to mock data
        toast.error('Camera access failed. Using mock data for demonstration.');
        setUsingMockData(true);
        startScanner();
      }
    }
  };

  // Stop the QR scanner
  const stopScanner = () => {
    setScanning(false);
    
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current
        .stop()
        .then(() => {
          console.log('Scanner stopped');
        })
        .catch((err) => {
          console.error('Error stopping scanner:', err);
        });
    }
  };

  const reset = () => {
    setConnected(false);
    setWifiCredentials(null);
    setError(null);
    
    // Restart the scanner to allow for a new scan
    stopScanner();
    setTimeout(() => {
      startScanner();
    }, 500);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Wi-Fi QR Code Scanner</CardTitle>
      </CardHeader>
      
      <CardContent>
        {!serverConnected && !usingMockData && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Cannot connect to Wi-Fi server. The scanner will still work but without server validation.
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
              <div className="flex items-center gap-2 text-gray-700 mt-1">
                <span>
                  <strong>Password:</strong> {wifiCredentials.password}
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
            <div className="relative bg-gray-100 rounded-md overflow-hidden" style={{ height: '300px' }}>
              {usingMockData ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-hydro-blue mb-4" />
                  <p className="text-gray-600">Scanning for Wi-Fi QR code...</p>
                  <p className="text-xs text-gray-500 mt-2">Simulating scan</p>
                </div>
              ) : (
                <div 
                  id={scannerContainerId} 
                  ref={containerRef}
                  className="w-full h-full"
                ></div>
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
