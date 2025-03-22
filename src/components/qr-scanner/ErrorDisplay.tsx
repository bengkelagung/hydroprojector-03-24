
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorDisplayProps {
  error: string | null;
  serverConnected: boolean;
  usingMockData: boolean;
}

/**
 * Component that displays any errors and connection status
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  serverConnected,
  usingMockData
}) => {
  return (
    <>
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
    </>
  );
};

export default ErrorDisplay;
