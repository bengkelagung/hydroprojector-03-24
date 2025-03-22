
import React, { useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ScannerContainerProps {
  scanning: boolean;
  usingMockData: boolean;
  scannerId: string;
}

/**
 * Component that renders the actual scanner container
 */
const ScannerContainer: React.FC<ScannerContainerProps> = ({
  scanning,
  usingMockData,
  scannerId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!scanning) return null;

  return (
    <div className="relative bg-black rounded-md overflow-hidden" style={{
      minHeight: '300px'
    }}>
      {usingMockData ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-hydro-blue mb-4" />
          <p className="text-white">Scanning for Wi-Fi QR code...</p>
        </div>
      ) : (
        <div 
          id={scannerId} 
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
  );
};

export default ScannerContainer;
