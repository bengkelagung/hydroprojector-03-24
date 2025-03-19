
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getCachedDevices, getCachedPins, getCachedProjects } from '@/utils/offlineStorage';

// Types for subscription callbacks
type DeviceUpdateCallback = (deviceId: string, updates: any) => void;
type PinUpdateCallback = (pinId: string, updates: any) => void;
type PinDataCallback = (pinId: string, value: string) => void;

// Keep track of active subscriptions
let deviceSubscription: any = null;
let pinConfigSubscription: any = null;
let pinDataSubscription: any = null;

// Connection status tracking
let isConnecting = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const baseReconnectDelayMs = 2000; // Starting with 2 seconds
const maxReconnectDelayMs = 30000; // Max 30 seconds

// WebSocket connection state
let isWebSocketConnected = false;
let cleanupInProgress = false; // Flag to prevent recursive removeChannel calls

// Initialize WebSocket connection state monitor
const initWebSocketMonitor = () => {
  try {
    console.log('Initializing connection monitoring');
    
    // Set up a test subscription to monitor connection status
    const monitorChannel = supabase.channel('connection-monitor');
    monitorChannel
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Connection monitoring active');
          isWebSocketConnected = true;
          reconnectAttempts = 0;
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.log('Connection monitoring detected closed connection');
          isWebSocketConnected = false;
          
          // Trigger offline mode if connection is lost
          if (status === 'CLOSED') {
            window.dispatchEvent(new Event('supabase-connection-closed'));
          }
        }
      });
      
    // Set up a periodic connection check
    setInterval(() => {
      checkSupabaseConnection().then(isConnected => {
        if (isConnected !== isWebSocketConnected) {
          console.log(`Connection status changed to: ${isConnected ? 'connected' : 'disconnected'}`);
          isWebSocketConnected = isConnected;
        }
      });
    }, 30000); // Check every 30 seconds
    
  } catch (error) {
    console.error('Error initializing WebSocket monitor:', error);
  }
};

// Call the initialize function
initWebSocketMonitor();

// Helper function to calculate exponential backoff delay
const getReconnectDelay = (): number => {
  // Exponential backoff formula: min(baseDelay * 2^attempts, maxDelay)
  const delay = Math.min(
    baseReconnectDelayMs * Math.pow(2, reconnectAttempts),
    maxReconnectDelayMs
  );
  return delay;
};

// Helper function to handle reconnection with exponential backoff
const handleReconnection = (channelName: string, callback: () => void) => {
  if (isConnecting) return;
  
  isConnecting = true;
  reconnectAttempts++;
  
  const delay = getReconnectDelay();
  console.log(`Attempting to reconnect to ${channelName} in ${delay/1000} seconds (attempt ${reconnectAttempts}/${maxReconnectAttempts})...`);
  
  if (reconnectAttempts <= maxReconnectAttempts) {
    setTimeout(() => {
      callback();
      isConnecting = false;
    }, delay);
  } else {
    console.error(`Max reconnect attempts (${maxReconnectAttempts}) reached for ${channelName}`);
    toast({
      title: "Connection Error",
      description: "Unable to establish a stable connection. Please refresh the page.",
      variant: "destructive"
    });
    isConnecting = false;
    
    // Dispatch event to trigger offline mode
    window.dispatchEvent(new Event('supabase-connection-failed'));
  }
};

// Check if Supabase realtime is available
const isRealtimeAvailable = (): boolean => {
  try {
    return !!supabase.realtime && typeof supabase.channel === 'function';
  } catch (error) {
    console.error('Error checking realtime availability:', error);
    return false;
  }
};

// Safe channel removal function - updated to prevent recursion
const safeRemoveChannel = async (channel: any, channelName: string) => {
  if (!channel) return;
  
  try {
    if (cleanupInProgress) {
      console.log(`Skipping recursive removal for ${channelName} channel`);
      return;
    }
    
    // Mark cleanup as in progress to prevent recursive calls
    cleanupInProgress = true;
    
    // First try to unsubscribe, which is safer than removing directly
    await new Promise<void>((resolve) => {
      try {
        channel.unsubscribe();
        console.log(`Unsubscribed from ${channelName} channel`);
        resolve();
      } catch (e) {
        console.error(`Error unsubscribing from ${channelName} channel:`, e);
        resolve(); // Resolve anyway to continue with removal
      }
    });
    
    // After unsubscribing, remove the channel with a short delay to avoid race conditions
    setTimeout(() => {
      try {
        supabase.removeChannel(channel);
        console.log(`Removed ${channelName} channel`);
      } catch (e) {
        console.error(`Error during final channel removal for ${channelName}:`, e);
      } finally {
        // Reset the cleanup flag
        cleanupInProgress = false;
      }
    }, 500);
  } catch (e) {
    console.error(`Error in safeRemoveChannel for ${channelName}:`, e);
    cleanupInProgress = false;
  }
};

// Subscribe to device changes
export const subscribeToDevices = (callback: DeviceUpdateCallback) => {
  // Ensure realtime is available
  if (!isRealtimeAvailable()) {
    console.error('Realtime service is not available');
    toast({
      title: "Service Error",
      description: "Realtime service unavailable",
      variant: "destructive"
    });
    
    // Return cached devices if available
    const cachedDevices = getCachedDevices();
    if (cachedDevices && cachedDevices.length > 0) {
      console.log('Using cached devices:', cachedDevices.length);
      callback('cached-devices', cachedDevices);
    }
    
    return () => {};
  }

  // If already subscribing, don't create a new subscription
  if (deviceSubscription) {
    console.log('Already subscribed to devices channel');
    return () => {
      if (deviceSubscription && !cleanupInProgress) {
        console.log('Removing existing devices subscription');
        safeRemoveChannel(deviceSubscription, 'devices');
        deviceSubscription = null;
      }
    };
  }

  try {
    console.log('Setting up devices subscription');
    
    // Create a new channel with a unique name to avoid conflicts
    const channelName = `devices-changes-${Date.now()}`;
    deviceSubscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devices' },
        (payload) => {
          console.log('Devices change received:', payload);
          
          if (payload.eventType === 'UPDATE') {
            callback(payload.new.id, payload.new);
          } else if (payload.eventType === 'DELETE' || payload.eventType === 'INSERT') {
            // Handle these events by notifying the user instead of forcing reload
            toast({
              title: payload.eventType === 'DELETE' ? 'Device Removed' : 'Device Added',
              description: 'Refreshing data...'
            });
            // Trigger a refresh through callback with null values to indicate refresh needed
            callback('refresh-needed', null);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Devices subscription status (${channelName}):`, status);
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to devices changes');
          isWebSocketConnected = true;
          reconnectAttempts = 0;
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.error(`Failed to subscribe to devices (${status})`);
          toast({
            title: "Connection Error",
            description: "Device connection lost. Using offline data.",
            variant: "destructive"
          });
          isWebSocketConnected = false;
          
          // Return cached devices if available
          const cachedDevices = getCachedDevices();
          if (cachedDevices && cachedDevices.length > 0) {
            console.log('Using cached devices (after connection closed):', cachedDevices.length);
            callback('cached-devices', cachedDevices);
          }
          
          // Clean up existing subscription
          if (deviceSubscription && !cleanupInProgress) {
            safeRemoveChannel(deviceSubscription, 'devices');
            deviceSubscription = null;
          }
          
          // Attempt to reconnect
          handleReconnection('devices', () => {
            subscribeToDevices(callback);
          });
        }
      });

    return () => {
      if (deviceSubscription && !cleanupInProgress) {
        console.log('Unsubscribing from devices channel');
        safeRemoveChannel(deviceSubscription, 'devices');
        deviceSubscription = null;
      }
    };
  } catch (error) {
    console.error('Error setting up device subscription:', error);
    toast({
      title: "Connection Error",
      description: "Failed to setup device monitoring",
      variant: "destructive"
    });
    deviceSubscription = null;
    
    // Return cached devices if available
    const cachedDevices = getCachedDevices();
    if (cachedDevices && cachedDevices.length > 0) {
      console.log('Using cached devices (after subscription error):', cachedDevices.length);
      callback('cached-devices', cachedDevices);
    }
    
    // Try to reconnect after error
    handleReconnection('devices-after-error', () => {
      subscribeToDevices(callback);
    });
    
    return () => {};
  }
};

// Subscribe to pin configuration changes
export const subscribeToPinConfigs = (callback: PinUpdateCallback) => {
  // Ensure realtime is available
  if (!isRealtimeAvailable()) {
    console.error('Realtime service is not available');
    toast({
      title: "Service Error",
      description: "Realtime service unavailable",
      variant: "destructive"
    });
    
    // Return cached pins if available
    const cachedPins = getCachedPins();
    if (cachedPins && cachedPins.length > 0) {
      console.log('Using cached pins:', cachedPins.length);
      callback('cached-pins', cachedPins);
    }
    
    return () => {};
  }
  
  // If already subscribed, return the unsubscribe function
  if (pinConfigSubscription) {
    console.log('Already subscribed to pin configs channel');
    return () => {
      if (pinConfigSubscription && !cleanupInProgress) {
        console.log('Removing existing pin configs subscription');
        safeRemoveChannel(pinConfigSubscription, 'pin-configs');
        pinConfigSubscription = null;
      }
    };
  }

  try {
    console.log('Setting up pin configs subscription');
    
    // Create a new channel with a unique name to avoid conflicts
    const channelName = `pin-configs-changes-${Date.now()}`;
    pinConfigSubscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pin_configs' },
        (payload) => {
          console.log('Pin config change received:', payload);
          
          if (payload.eventType === 'UPDATE') {
            callback(payload.new.id, payload.new);
          } else if (payload.eventType === 'DELETE' || payload.eventType === 'INSERT') {
            // Handle these events by notifying the user instead of forcing reload
            toast({
              title: payload.eventType === 'DELETE' ? 'Pin configuration removed' : 'Pin configuration added',
              description: 'Refreshing data...'
            });
            // Trigger a refresh through callback with null values to indicate refresh needed
            callback('refresh-needed', null);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Pin configs subscription status (${channelName}):`, status);
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to pin config changes');
          isWebSocketConnected = true;
          reconnectAttempts = 0;
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.error(`Failed to subscribe to pin configs (${status})`);
          toast({
            title: "Connection Error",
            description: "Pin connection lost. Using offline data.",
            variant: "destructive"
          });
          isWebSocketConnected = false;
          
          // Return cached pins if available
          const cachedPins = getCachedPins();
          if (cachedPins && cachedPins.length > 0) {
            console.log('Using cached pins (after connection closed):', cachedPins.length);
            callback('cached-pins', cachedPins);
          }
          
          // Clean up existing subscription
          if (pinConfigSubscription && !cleanupInProgress) {
            safeRemoveChannel(pinConfigSubscription, 'pin-configs');
            pinConfigSubscription = null;
          }
          
          // Attempt to reconnect
          handleReconnection('pin-configs', () => {
            subscribeToPinConfigs(callback);
          });
        }
      });

    return () => {
      if (pinConfigSubscription && !cleanupInProgress) {
        console.log('Unsubscribing from pin configs channel');
        safeRemoveChannel(pinConfigSubscription, 'pin-configs');
        pinConfigSubscription = null;
      }
    };
  } catch (error) {
    console.error('Error setting up pin config subscription:', error);
    toast({
      title: "Connection Error",
      description: "Failed to setup pin configuration monitoring",
      variant: "destructive"
    });
    pinConfigSubscription = null;
    
    // Return cached pins if available
    const cachedPins = getCachedPins();
    if (cachedPins && cachedPins.length > 0) {
      console.log('Using cached pins (after subscription error):', cachedPins.length);
      callback('cached-pins', cachedPins);
    }
    
    // Try to reconnect after error
    handleReconnection('pin-configs-after-error', () => {
      subscribeToPinConfigs(callback);
    });
    
    return () => {};
  }
};

// Subscribe to pin data changes
export const subscribeToPinData = (callback: PinDataCallback) => {
  // Ensure realtime is available
  if (!isRealtimeAvailable()) {
    console.error('Realtime service is not available');
    toast({
      title: "Service Error",
      description: "Realtime service unavailable",
      variant: "destructive"
    });
    return () => {};
  }
  
  // If already subscribed, return the unsubscribe function
  if (pinDataSubscription) {
    console.log('Already subscribed to pin data channel');
    return () => {
      if (pinDataSubscription && !cleanupInProgress) {
        console.log('Removing existing pin data subscription');
        safeRemoveChannel(pinDataSubscription, 'pin-data');
        pinDataSubscription = null;
      }
    };
  }

  try {
    console.log('Setting up pin data subscription');
    
    // Create a new channel with a unique name to avoid conflicts
    const channelName = `pin-data-changes-${Date.now()}`;
    pinDataSubscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pin_data' },
        (payload) => {
          console.log('Pin data change received:', payload);
          
          if (payload.new) {
            callback(payload.new.pin_config_id, payload.new.value);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Pin data subscription status (${channelName}):`, status);
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to pin data changes');
          isWebSocketConnected = true;
          reconnectAttempts = 0;
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.error(`Failed to subscribe to pin data (${status})`);
          toast({
            title: "Connection Error",
            description: "Pin data connection lost. Trying to reconnect...",
            variant: "destructive"
          });
          isWebSocketConnected = false;
          
          // Clean up existing subscription
          if (pinDataSubscription && !cleanupInProgress) {
            safeRemoveChannel(pinDataSubscription, 'pin-data');
            pinDataSubscription = null;
          }
          
          // Attempt to reconnect
          handleReconnection('pin-data', () => {
            subscribeToPinData(callback);
          });
        }
      });

    return () => {
      if (pinDataSubscription && !cleanupInProgress) {
        console.log('Unsubscribing from pin data channel');
        safeRemoveChannel(pinDataSubscription, 'pin-data');
        pinDataSubscription = null;
      }
    };
  } catch (error) {
    console.error('Error setting up pin data subscription:', error);
    toast({
      title: "Connection Error",
      description: "Failed to setup pin data monitoring",
      variant: "destructive"
    });
    pinDataSubscription = null;
    
    // Try to reconnect after error
    handleReconnection('pin-data-after-error', () => {
      subscribeToPinData(callback);
    });
    
    return () => {};
  }
};

// Function to check connection status with Supabase
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Try a simple query to check if the connection works
    const { data, error } = await supabase.from('pins').select('id').limit(1);
    
    if (error) {
      console.error('Supabase connection check failed:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    return false;
  }
};

// Function to check WebSocket connection status
export const isWebSocketActive = (): boolean => {
  return isWebSocketConnected;
};

// Helper function to unsubscribe from all channels
export const unsubscribeAll = () => {
  // Set flag to prevent recursive removeChannel calls
  cleanupInProgress = true;
  
  try {
    if (deviceSubscription) {
      console.log('Unsubscribing from devices channel');
      safeRemoveChannel(deviceSubscription, 'devices');
      deviceSubscription = null;
    }
    
    if (pinConfigSubscription) {
      console.log('Unsubscribing from pin configs channel');
      safeRemoveChannel(pinConfigSubscription, 'pin-configs');
      pinConfigSubscription = null;
    }
    
    if (pinDataSubscription) {
      console.log('Unsubscribing from pin data channel');
      safeRemoveChannel(pinDataSubscription, 'pin-data');
      pinDataSubscription = null;
    }
    
    console.log('Successfully unsubscribed from all channels');
  } catch (error) {
    console.error('Error unsubscribing from channels:', error);
  } finally {
    // Reset the cleanup flag after a short delay to ensure any pending operations complete
    setTimeout(() => {
      cleanupInProgress = false;
    }, 500);
  }
};

// Manual reconnect function - can be called if auto-reconnect fails
export const reconnectAllChannels = (
  deviceCallback: DeviceUpdateCallback,
  pinConfigCallback: PinUpdateCallback, 
  pinDataCallback: PinDataCallback
) => {
  unsubscribeAll();
  
  // Reset connection state
  isConnecting = false;
  reconnectAttempts = 0;
  
  // Small delay before reconnecting
  setTimeout(() => {
    subscribeToDevices(deviceCallback);
    subscribeToPinConfigs(pinConfigCallback);
    subscribeToPinData(pinDataCallback);
  }, 1000);
};

// Check if we're currently subscribed to a specific channel
export const isSubscribedToChannel = (channelType: 'devices' | 'pin-configs' | 'pin-data'): boolean => {
  switch (channelType) {
    case 'devices':
      return deviceSubscription !== null;
    case 'pin-configs':
      return pinConfigSubscription !== null;
    case 'pin-data':
      return pinDataSubscription !== null;
    default:
      return false;
  }
};

// Force reconnection to all channels
export const forceReconnectAll = (
  deviceCallback: DeviceUpdateCallback,
  pinConfigCallback: PinUpdateCallback, 
  pinDataCallback: PinDataCallback
) => {
  unsubscribeAll();
  
  // Reset reconnect attempts
  reconnectAttempts = 0;
  isConnecting = false;
  
  // Try to reconnect immediately
  subscribeToDevices(deviceCallback);
  subscribeToPinConfigs(pinConfigCallback);
  subscribeToPinData(pinDataCallback);
};
