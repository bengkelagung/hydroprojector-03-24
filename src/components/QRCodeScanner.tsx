
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useQRScanner } from './qr-scanner/QRScannerLogic';
import ScannerContainer from './qr-scanner/ScannerContainer';
import QRScannerControls from './qr-scanner/QRScannerControls';
import WiFiCredentialsDisplay from './qr-scanner/WiFiCredentialsDisplay';
import ErrorDisplay from './qr-scanner/ErrorDisplay';

interface QRScannerProps {
  onConnect: (ssid: string, password: string) => void;
  serverConnected?: boolean;
  useMockData?: boolean;
}

/**
 * QR Code Scanner component that handles scanning WiFi QR codes
 * Refactored to use smaller, focused components
 */
const QRCodeScanner: React.FC<QRScannerProps> = ({
  onConnect,
  serverConnected = false,
  useMockData = false
}) => {
  const {
    scanning,
    error,
    wifiCredentials,
    usingMockData,
    startScanner,
    stopScanner
  } = useQRScanner(onConnect, serverConnected, useMockData);

  const scannerContainerId = 'qr-reader';

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Wi-Fi QR Code Scanner</CardTitle>
      </CardHeader>
      
      <CardContent>
        <ErrorDisplay 
          error={error}
          serverConnected={serverConnected}
          usingMockData={usingMockData}
        />
        
        <WiFiCredentialsDisplay credentials={wifiCredentials} />
        
        {scanning ? (
          <div className="space-y-4">
            <ScannerContainer 
              scanning={scanning}
              usingMockData={usingMockData}
              scannerId={scannerContainerId}
            />
            
            <QRScannerControls 
              scanning={scanning}
              startScanner={startScanner}
              stopScanner={stopScanner}
            />
          </div>
        ) : (
          <QRScannerControls 
            scanning={scanning}
            startScanner={startScanner}
            stopScanner={stopScanner}
          />
        )}
      </CardContent>
      
      <CardFooter className="bg-gray-50 px-6 py-4">
        <p className="text-xs text-gray-500"></p>
      </CardFooter>
    </Card>
  );
};

export default QRCodeScanner;
