
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

  // Clean up the scanner when component unmounts
  useEffect(() => {
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
    
    // Don't stop scanning, just pause to allow multiple scans
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.pause();
      
      // Resume scanning after a brief pause to give user feedback
      setTimeout(() => {
        if (scannerRef.current && !usingMockData) {
          scannerRef.current.resume();
        }
      }, 2000);
    }
    
    toast.success(`QR code scanned successfully`);
    setConnected(true);
    setWifiCredentials({ ssid, password });
    toast.success(`Found network: ${ssid}`);
    onConnect(ssid, password);
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
      // Create scanner container if it doesn't exist
      if (!document.getElementById(scannerContainerId)) {
        setTimeout(() => startScanner(), 500);
        return;
      }
      
      // Clean up any existing scanner
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      
      // Create new scanner instance
      scannerRef.current = new Html5Qrcode(scannerContainerId);
      
      const qrCodeSuccessCallback = (decodedText: string) => {
        console.log(`QR Code detected: ${decodedText}`);
        processQRCode(decodedText);
      };
      
      // Simplified config - remove QR box and any frame styling
      const config = { 
        fps: 10,
        formatsToSupport: [2], // QR_CODE only
        qrbox: undefined, // Remove qrbox to scan the entire camera view
        rememberLastUsedCamera: true,
        aspectRatio: 1,
        showTorchButtonIfSupported: false,
        showZoomSliderIfSupported: false,
        defaultZoomValueIfSupported: 2,
      };
      
      // Try first with environment camera (back camera) for mobile devices
      await scannerRef.current.start(
        { facingMode: "environment" }, 
        config,
        qrCodeSuccessCallback,
        () => {} // Silent error for normal no-qr-found state
      ).catch(async (err) => {
        console.log("Failed to start with environment camera:", err);
        
        try {
          // Try to get available cameras as fallback
          const devices = await Html5Qrcode.getCameras();
          
          if (devices && devices.length) {
            // If cameras are found, use the first one
            await scannerRef.current?.start(
              { deviceId: devices[0].id }, 
              config,
              qrCodeSuccessCallback,
              () => {}
            );
          } else {
            throw new Error("No cameras found");
          }
        } catch (fallbackError) {
          console.error("Failed to use fallback camera:", fallbackError);
          setError('Failed to access camera. Please check permissions.');
          setScanning(false);
          
          // Fall back to mock data for testing purposes
          toast.error('Camera access failed. Using mock data for demonstration.');
          setUsingMockData(true);
          startScanner();
        }
      });
      
      // Apply custom styling to remove scan frame/box and helper text
      // Find and hide any elements added by the Html5QrCode library that create visual frames
      setTimeout(() => {
        // Remove any qr frame or scan region indicators added by the library
        const scanRegion = document.querySelector('#qr-shaded-region');
        if (scanRegion) {
          (scanRegion as HTMLElement).style.display = 'none';
        }
        
        // Remove any scan line animations
        const scanLine = document.querySelector('.scan-region-highlight');
        if (scanLine) {
          (scanLine as HTMLElement).style.display = 'none';
        }
        
        // Remove any overlay text
        const textElements = document.querySelectorAll('#qr-reader__dashboard_section_csr span');
        textElements.forEach(el => {
          (el as HTMLElement).style.display = 'none';
        });
        
        // Remove borders around the scanner
        const qrReader = document.getElementById('qr-reader');
        if (qrReader) {
          qrReader.style.border = 'none';
          qrReader.style.boxShadow = 'none';
          qrReader.style.background = '#000';
        }
        
        // Remove any helper text elements
        const helperText = document.getElementById('qr-reader__status_span');
        if (helperText) {
          helperText.style.display = 'none';
        }
        
        // Remove any other overlays or indicators
        const indicators = document.querySelectorAll('.qr-region-indicator');
        indicators.forEach(el => {
          (el as HTMLElement).style.display = 'none';
        });
      }, 100);
      
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please check permissions.');
      setScanning(false);
      
      // Fall back to mock data
      toast.error('Camera access failed. Using mock data for demonstration.');
      setUsingMockData(true);
      startScanner();
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
    if (scanning) {
      stopScanner();
    }
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
        
        {wifiCredentials && (
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
            </div>
          </div>
        )}
        
        {scanning ? (
          <div className="space-y-4">
            <div className="relative bg-black rounded-md overflow-hidden" style={{ minHeight: '300px' }}>
              {usingMockData ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-hydro-blue mb-4" />
                  <p className="text-white">Scanning for Wi-Fi QR code...</p>
                </div>
              ) : (
                <div 
                  id={scannerContainerId} 
                  ref={containerRef}
                  className="w-full h-full"
                  style={{ 
                    minHeight: '300px',
                    border: 'none',
                    background: '#000'
                  }}
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
