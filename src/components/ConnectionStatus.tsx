
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, X, ServerCrash, AlertTriangle, RefreshCw } from 'lucide-react';
import { isSupabaseAvailable, isOnline } from '@/utils/supabaseHelpers';
import { getCachedDevices, getCachedPins, getCachedProjects } from '@/utils/offlineStorage';

export default function ConnectionStatus() {
  const [isOnlineState, setIsOnlineState] = useState(navigator.onLine);
  const [isDbConnected, setIsDbConnected] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [errorType, setErrorType] = useState<'offline' | 'resources' | 'connection' | null>(null);
  const [hasCachedData, setHasCachedData] = useState(false);

  // Check for cached data availability
  useEffect(() => {
    const devices = getCachedDevices();
    const pins = getCachedPins();
    const projects = getCachedProjects();
    
    setHasCachedData(
      Array.isArray(devices) && devices.length > 0 || 
      Array.isArray(pins) && pins.length > 0 || 
      Array.isArray(projects) && projects.length > 0
    );
  }, []);

  // Function to check Supabase connection
  const checkSupabaseConnection = async () => {
    if (!isOnlineState) {
      setIsDbConnected(false);
      return;
    }

    try {
      setCheckingConnection(true);
      const available = await isSupabaseAvailable();
      setIsDbConnected(available);
      
      if (!available) {
        // First check what type of error we're dealing with
        const resourceError = await fetch('https://vtqxdgejqgyhhvnaxnfq.supabase.co/rest/v1/health')
          .then(res => res.status === 429)
          .catch(() => false);
          
        setErrorType(resourceError ? 'resources' : 'connection');
        setIsVisible(true);
      } else if (isVisible && (errorType === 'connection' || errorType === 'resources')) {
        // If we're showing a connection error and the connection is now available
        setIsVisible(false);
        setErrorType(null);
        // Trigger data refresh
        window.dispatchEvent(new CustomEvent('refresh-data'));
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

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnlineState(true);
      // Check database connection when back online
      checkSupabaseConnection();
    };
    
    const handleOffline = () => {
      setIsOnlineState(false);
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

  // Check database connection periodically and on mount
  useEffect(() => {
    let checkInterval: NodeJS.Timeout;
    
    // Check immediately on mount or when online status changes
    checkSupabaseConnection();

    // Set up interval to check every 30 seconds
    checkInterval = setInterval(checkSupabaseConnection, 30000);

    return () => {
      clearInterval(checkInterval);
    };
  }, [isOnlineState, isVisible, errorType]);

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
              ? "You are currently offline. " + (hasCachedData ? "Using cached data." : "Some features may not work.")
              : errorType === 'resources'
              ? "The server is experiencing high load. " + (hasCachedData ? "Using cached data." : "Please try again later.")
              : "Unable to connect to the database. " + (hasCachedData ? "Using cached data." : "Please try again later.")}
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
          {checkingConnection ? 'Checking...' : <RefreshCw className="h-4 w-4 mr-1" />}
          {!checkingConnection && 'Retry'}
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
