
import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'sonner';

// Mock data for testing without a camera
const mockQRData = ['WIFI:S:HomeWifi;T:WPA;P:password123;;', 'WIFI:S:GuestNetwork;T:WPA;P:guest2023;;', 'WIFI:S:OfficeWifi;T:WPA2;P:office@secure;;'];

export interface QRScannerState {
  scanning: boolean;
  connected: boolean;
  wifiCredentials: {
    ssid: string;
    password: string;
  } | null;
  error: string | null;
  usingMockData: boolean;
}

export interface QRScannerHookResult extends QRScannerState {
  startScanner: () => void;
  stopScanner: () => void;
  reset: () => void;
}

/**
 * Custom hook that encapsulates the QR scanner logic
 */
export const useQRScanner = (
  onConnect: (ssid: string, password: string) => void,
  serverConnected: boolean = false,
  useMockData: boolean = false
): QRScannerHookResult => {
  const [state, setState] = useState<QRScannerState>({
    scanning: false,
    connected: false,
    wifiCredentials: null,
    error: null,
    usingMockData: useMockData
  });
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader';

  // Clean up the scanner when component unmounts
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // Process the QR code data
  const processQRCode = (qrData: string) => {
    setState(prev => ({ ...prev, error: null }));
    console.log("Processing QR code:", qrData);

    if (!qrData.includes('WIFI:S:')) {
      setState(prev => ({ ...prev, error: 'Invalid QR code format. Not a Wi-Fi QR code.' }));
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
      setState(prev => ({ ...prev, error: error.message }));
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
        if (scannerRef.current && !state.usingMockData) {
          scannerRef.current.resume();
        }
      }, 2000);
    }
    
    toast.success(`QR code scanned successfully`);
    setState(prev => ({
      ...prev,
      connected: true,
      wifiCredentials: { ssid, password }
    }));
    
    toast.success(`Found network: ${ssid}`);
    
    // Make sure to call onConnect with the scanned credentials
    // This is the key part that ensures the credentials are passed up to the parent
    onConnect(ssid, password);
  };

  // Start the QR scanner
  const startScanner = async () => {
    setState(prev => ({ ...prev, scanning: true, error: null }));
    
    if (state.usingMockData) {
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
        rememberLastUsedCamera: false, // Don't remember last camera to avoid history
        aspectRatio: 1,
        showTorchButtonIfSupported: false,
        showZoomSliderIfSupported: false,
        defaultZoomValueIfSupported: 2
      };

      // Try first with environment camera (back camera) for mobile devices
      await scannerRef.current.start({
        facingMode: "environment"
      }, config, qrCodeSuccessCallback, () => {} // Silent error for normal no-qr-found state
      ).catch(async err => {
        console.log("Failed to start with environment camera:", err);
        try {
          // Try to get available cameras as fallback
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length) {
            // If cameras are found, use the first one
            await scannerRef.current?.start({
              deviceId: devices[0].id
            }, config, qrCodeSuccessCallback, () => {});
          } else {
            throw new Error("No cameras found");
          }
        } catch (fallbackError) {
          console.error("Failed to use fallback camera:", fallbackError);
          setState(prev => ({ 
            ...prev, 
            error: 'Failed to access camera. Please check permissions.',
            scanning: false,
            usingMockData: true 
          }));

          // Fall back to mock data for testing purposes
          toast.error('Camera access failed. Using mock data for demonstration.');
          startScanner();
        }
      });

      // Apply custom styling to remove scan frame/box and helper text
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
      setState(prev => ({
        ...prev,
        error: 'Failed to access camera. Please check permissions.',
        scanning: false,
        usingMockData: true
      }));

      // Fall back to mock data
      toast.error('Camera access failed. Using mock data for demonstration.');
      startScanner();
    }
  };

  // Stop the QR scanner
  const stopScanner = () => {
    setState(prev => ({ ...prev, scanning: false }));
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        console.log('Scanner stopped');
      }).catch(err => {
        console.error('Error stopping scanner:', err);
      });
    }
  };

  const reset = () => {
    setState({
      scanning: false,
      connected: false,
      wifiCredentials: null,
      error: null,
      usingMockData: state.usingMockData
    });
    
    if (state.scanning) {
      stopScanner();
    }
  };

  return {
    ...state,
    startScanner,
    stopScanner,
    reset
  };
};
