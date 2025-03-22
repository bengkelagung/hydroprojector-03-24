
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const DeviceNotFound: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="max-w-2xl mx-auto">
      <Alert variant="destructive" className="mb-8">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Device not found. It may have been deleted or you don't have access to it.
        </AlertDescription>
      </Alert>
      
      <Button
        onClick={() => navigate('/dashboard')}
        variant="outline"
      >
        Return to Dashboard
      </Button>
    </div>
  );
};

export default DeviceNotFound;
