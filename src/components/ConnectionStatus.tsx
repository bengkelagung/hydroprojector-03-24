
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, X, ServerCrash, AlertTriangle } from 'lucide-react';
import { isSupabaseAvailable } from '@/utils/supabaseHelpers';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDbConnected, setIsDbConnected] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [errorType, setErrorType] = useState<'offline' | 'resources' | 'connection' | null>(null);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setErrorType('offline');
      setIsVisible(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for custom resource error events
  useEffect(() => {
    const handleResourceError = () => {
      setErrorType('resources');
      setIsDbConnected(false);
      setIsVisible(true);
    };

    window.addEventListener('supabase-resource-error', handleResourceError);

    return () => {
      window.removeEventListener('supabase-resource-error', handleResourceError);
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
        
        if (!available) {
          setErrorType('connection');
          setIsVisible(true);
        } else if (isVisible && errorType === 'connection') {
          // If we're showing a connection error and the connection is now available
          setIsVisible(false);
        }
      } catch (error: any) {
        console.error('Error checking database connection:', error);
        setIsDbConnected(false);
        
        if (error?.message?.includes('ERR_INSUFFICIENT_RESOURCES')) {
          setErrorType('resources');
        } else {
          setErrorType('connection');
        }
        
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
  }, [isOnline, isVisible, errorType]);

  const handleRetry = async () => {
    setCheckingConnection(true);
    try {
      const available = await isSupabaseAvailable();
      setIsDbConnected(available);
      if (available) {
        setIsVisible(false);
        setErrorType(null);
        // Dispatch a custom event to trigger data refresh
        window.dispatchEvent(new CustomEvent('refresh-data'));
      }
    } catch (error) {
      console.error('Error checking database connection on retry:', error);
    } finally {
      setCheckingConnection(false);
    }
  };

  if (!isVisible) return null;

  return (
    <Alert 
      variant={errorType === 'resources' ? "destructive" : "default"} 
      className="mb-4 flex items-center justify-between"
    >
      <div className="flex items-center space-x-2">
        {errorType === 'offline' && <WifiOff className="h-4 w-4" />}
        {errorType === 'resources' && <ServerCrash className="h-4 w-4" />}
        {errorType === 'connection' && <AlertTriangle className="h-4 w-4" />}
        <div>
          <AlertTitle>
            {errorType === 'offline' && "You're Offline"}
            {errorType === 'resources' && "Server Overloaded"}
            {errorType === 'connection' && "Connection Issue"}
          </AlertTitle>
          <AlertDescription>
            {errorType === 'offline' 
              ? "You are currently offline. Some features may not work properly."
              : errorType === 'resources'
              ? "The server is experiencing high load. Please try again later or use offline features."
              : "Unable to connect to the database. Please try again later."}
          </AlertDescription>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRetry} 
          disabled={checkingConnection || errorType === 'offline'}
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
