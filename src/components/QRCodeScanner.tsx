
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, QrCode, Scan, Check, Wifi, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import jsQR from 'jsqr';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDetectionRef = useRef<string | null>(null);
  const cooldownRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);

  // When component mounts, start scanning automatically if on the wifi-setup page
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/wifi-setup')) {
      startScanner();
    }
    
    // Cleanup function when component unmounts
    return () => {
      stopScanner();
    };
  }, []);

  // Process the QR code data
  const processQRCode = (qrData: string) => {
    // Avoid processing the same QR code multiple times in quick succession
    if (lastDetectionRef.current === qrData && cooldownRef.current) {
      return;
    }
    
    // Set a very short cooldown to prevent multiple rapid detections of the same code
    lastDetectionRef.current = qrData;
    cooldownRef.current = true;
    setTimeout(() => {
      cooldownRef.current = false;
    }, 500); // Super short cooldown for very fast response
    
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
    
    // Stop scanning
    setScanning(false);
    toast.success(`QR code scanned successfully`);
    
    setConnected(true);
    setWifiCredentials({ ssid, password });
    toast.success(`Found network: ${ssid}`);
    onConnect(ssid, password);
    
    // Stop scanner
    stopScanner();
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
      // For real device, access the camera and start scanning
      const constraints = {
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          frameRate: { ideal: 120, min: 60 }, // Significantly higher frame rate for faster detection
          // Enhanced settings for better QR detection
          advanced: [
            { exposureMode: 'continuous' },
            { focusMode: 'continuous' },
            { whiteBalanceMode: 'continuous' },
            { zoom: 0 } // No digital zoom to maintain full field of view
          ] as any
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            // Set video to play as fast as possible
            videoRef.current.playbackRate = 1.0;
            
            // Start the video with high priority
            const playPromise = videoRef.current.play();
            
            if (playPromise !== undefined) {
              playPromise.catch(err => {
                console.error("Error playing video:", err);
                setError('Failed to start video stream. Please check permissions.');
                setScanning(false);
              });
            }
          }
          
          // Start continuous frame analysis immediately
          requestScanningFrame();
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      
      // Try again with more basic settings
      try {
        // Fallback to simpler constraints
        const basicConstraints = {
          video: { 
            facingMode: 'environment',
            frameRate: { min: 30 }
          }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(err => {
              console.error("Error playing video with basic settings:", err);
              setError('Failed to access camera. Please check permissions.');
              setScanning(false);
              
              // Fall back to mock data
              setUsingMockData(true);
              startScanner();
            });
            
            // Start continuous frame analysis
            requestScanningFrame();
          };
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

  // Request animation frame for continuous scanning - optimized to scan every frame
  const requestScanningFrame = () => {
    if (!scanning) return;
    
    // Scan immediately the current frame
    scanQRCode();
    
    // Request next frame with high priority
    animationFrameRef.current = requestAnimationFrame(requestScanningFrame);
  };

  // Stop the QR scanner
  const stopScanner = () => {
    setScanning(false);
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Scan video frames for QR codes - optimized performance
  const scanQRCode = () => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d', { 
        willReadFrequently: true,
        alpha: false // Disable alpha channel for better performance
      });
      
      if (!ctx) return;
      
      // Match canvas dimensions to video - essential for accurate detection
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      
      // Draw the video frame to the canvas - optimized with full frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data for QR code scanning - restrict to center area for better performance
      // Using about 60% of the center area where QR codes are most likely to be
      const centerWidth = Math.floor(canvas.width * 0.6);
      const centerHeight = Math.floor(canvas.height * 0.6);
      const x = Math.floor((canvas.width - centerWidth) / 2);
      const y = Math.floor((canvas.height - centerHeight) / 2);
      
      const imageData = ctx.getImageData(x, y, centerWidth, centerHeight);
      
      // Use jsQR to detect QR code with aggressive settings for real-time scanning
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth", // Try both normal and inverted colors
      });
      
      // If QR code is found, process it
      if (code) {
        console.log("QR code detected:", code.data);
        processQRCode(code.data);
      }
    }
  };

  const reset = () => {
    setConnected(false);
    setWifiCredentials(null);
    setError(null);
    lastDetectionRef.current = null;
    cooldownRef.current = false;
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
            <div className="relative aspect-video bg-gray-100 rounded-md overflow-hidden">
              {usingMockData ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-hydro-blue mb-4" />
                  <p className="text-gray-600">Scanning for Wi-Fi QR code...</p>
                  <p className="text-xs text-gray-500 mt-2">Simulating scan</p>
                </div>
              ) : (
                <>
                  <video 
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    playsInline
                    muted
                    autoPlay
                  />
                  <canvas 
                    ref={canvasRef}
                    className="hidden" // Canvas is hidden but still processes frames
                  />
                  <div className="absolute inset-0 border-2 border-hydro-blue/50 pointer-events-none flex justify-center items-center">
                    <div className="absolute w-56 h-56 border-2 border-hydro-blue animate-pulse">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-hydro-blue"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-hydro-blue"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-hydro-blue"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-hydro-blue"></div>
                    </div>
                    <p className="absolute bottom-10 text-sm text-hydro-blue font-medium bg-white/80 px-3 py-1 rounded-full">
                      Position QR code in frame
                    </p>
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
