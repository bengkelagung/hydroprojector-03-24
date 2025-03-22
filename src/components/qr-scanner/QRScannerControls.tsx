
import React from 'react';
import { Button } from '@/components/ui/button';
import { QrCode, Scan } from 'lucide-react';

interface QRScannerControlsProps {
  scanning: boolean;
  startScanner: () => void;
  stopScanner: () => void;
}

/**
 * Component that renders the scanner controls (start/stop buttons)
 */
const QRScannerControls: React.FC<QRScannerControlsProps> = ({
  scanning,
  startScanner,
  stopScanner
}) => {
  if (scanning) {
    return (
      <Button onClick={stopScanner} variant="outline" className="w-full">
        Cancel Scanning
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-center p-6 space-y-4">
      <QrCode className="h-16 w-16 text-hydro-blue mb-2" />
      <h3 className="text-lg font-medium text-center">Scan a Wi-Fi QR Code</h3>
      <p className="text-center text-gray-600 max-w-md">
        Point your camera at a Wi-Fi QR code to connect your device to the network.
      </p>
      <Button onClick={startScanner} className="bg-hydro-blue hover:bg-blue-700 mt-2">
        <Scan className="mr-2 h-4 w-4" />
        Start Scanning
      </Button>
    </div>
  );
};

export default QRScannerControls;
