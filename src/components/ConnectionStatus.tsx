
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, X } from 'lucide-react';
import { isSupabaseAvailable } from '@/utils/supabaseHelpers';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDbConnected, setIsDbConnected] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(false);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check database connection periodically
  useEffect(() => {
    let checkInterval: NodeJS.Timeout;
    
    const checkConnection = async () => {
      if (!isOnline) {
        setIsDbConnected(false);
        return;
      }

      try {
        setCheckingConnection(true);
        const available = await isSupabaseAvailable();
        setIsDbConnected(available);
        setIsVisible(!available);
      } catch (error) {
        console.error('Error checking database connection:', error);
        setIsDbConnected(false);
        setIsVisible(true);
      } finally {
        setCheckingConnection(false);
      }
    };

    // Check immediately on mount or when online status changes
    checkConnection();

    // Set up interval to check every 30 seconds
    checkInterval = setInterval(checkConnection, 30000);

    return () => {
      clearInterval(checkInterval);
    };
  }, [isOnline]);

  const handleRetry = async () => {
    setCheckingConnection(true);
    try {
      const available = await isSupabaseAvailable();
      setIsDbConnected(available);
      if (available) {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Error checking database connection on retry:', error);
    } finally {
      setCheckingConnection(false);
    }
  };

  if (!isVisible) return null;

  return (
    <Alert variant="destructive" className="mb-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        <div>
          <AlertTitle>Connection Issue</AlertTitle>
          <AlertDescription>
            {!isOnline 
              ? "You are currently offline. Some features may not work properly."
              : "Unable to connect to the database. Please try again later."}
          </AlertDescription>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRetry} 
          disabled={checkingConnection}
        >
          {checkingConnection ? 'Checking...' : 'Retry'}
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsVisible(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
