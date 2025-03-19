import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

// Initialize WebSocket connection state monitor
const initWebSocketMonitor = () => {
  try {
    // For Supabase-js v2, we can't directly access the WebSocket
    // Instead, let's use subscription status as a proxy for connection health
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
    console.error('Error initializing connection monitor:', error);
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
    toast.error(`Unable to establish a stable connection. Please refresh the page.`);
    isConnecting = false;
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

// Subscribe to device changes
export const subscribeToDevices = (callback: DeviceUpdateCallback) => {
  // Ensure realtime is available
  if (!isRealtimeAvailable()) {
    console.error('Realtime service is not available');
    toast.error('Realtime service unavailable');
    return () => {};
  }

  // If already subscribing, don't create a new subscription
  if (deviceSubscription) {
    console.log('Already subscribed to devices channel');
    return () => {
      if (deviceSubscription) {
        console.log('Removing existing devices subscription');
        try {
          supabase.removeChannel(deviceSubscription);
        } catch (e) {
          console.error('Error removing device channel:', e);
        }
        deviceSubscription = null;
      }
    };
  }

  try {
    console.log('Setting up devices subscription');
    deviceSubscription = supabase
      .channel('devices-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devices' },
        (payload) => {
          console.log('Devices change received:', payload);
          
          if (payload.eventType === 'UPDATE') {
            callback(payload.new.id, payload.new);
          } else if (payload.eventType === 'DELETE' || payload.eventType === 'INSERT') {
            // Handle these events by notifying the user instead of forcing reload
            toast.info(`Device ${payload.eventType === 'DELETE' ? 'removed' : 'added'}. Refreshing data...`);
            // Trigger a refresh through callback with null values to indicate refresh needed
            callback('refresh-needed', null);
          }
        }
      )
      .subscribe((status) => {
        console.log('Devices subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to devices changes');
          isWebSocketConnected = true;
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to devices:', status);
          toast.error('Device connection lost. Reconnecting...');
          isWebSocketConnected = false;
          
          // Clean up existing subscription
          if (deviceSubscription) {
            try {
              supabase.removeChannel(deviceSubscription);
            } catch (e) {
              console.error('Error removing device channel:', e);
            }
            deviceSubscription = null;
          }
          
          // Attempt to reconnect
          handleReconnection('devices', () => {
            subscribeToDevices(callback);
          });
        }
      });

    return () => {
      if (deviceSubscription) {
        console.log('Unsubscribing from devices channel');
        try {
          supabase.removeChannel(deviceSubscription);
        } catch (e) {
          console.error('Error removing device channel during cleanup:', e);
        }
        deviceSubscription = null;
      }
    };
  } catch (error) {
    console.error('Error setting up device subscription:', error);
    toast.error('Failed to setup device monitoring');
    deviceSubscription = null;
    
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
    toast.error('Realtime service unavailable');
    return () => {};
  }
  
  // If already subscribed, return the unsubscribe function
  if (pinConfigSubscription) {
    console.log('Already subscribed to pin configs channel');
    return () => {
      if (pinConfigSubscription) {
        console.log('Removing existing pin configs subscription');
        try {
          supabase.removeChannel(pinConfigSubscription);
        } catch (e) {
          console.error('Error removing pin config channel:', e);
        }
        pinConfigSubscription = null;
      }
    };
  }

  try {
    console.log('Setting up pin configs subscription');
    pinConfigSubscription = supabase
      .channel('pin-configs-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pin_configs' },
        (payload) => {
          console.log('Pin config change received:', payload);
          
          if (payload.eventType === 'UPDATE') {
            callback(payload.new.id, payload.new);
          } else if (payload.eventType === 'DELETE' || payload.eventType === 'INSERT') {
            // Handle these events by notifying the user instead of forcing reload
            toast.info(`Pin configuration ${payload.eventType === 'DELETE' ? 'removed' : 'added'}. Refreshing data...`);
            // Trigger a refresh through callback with null values to indicate refresh needed
            callback('refresh-needed', null);
          }
        }
      )
      .subscribe((status) => {
        console.log('Pin configs subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to pin config changes');
          isWebSocketConnected = true;
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to pin configs:', status);
          toast.error('Pin configuration connection lost. Reconnecting...');
          isWebSocketConnected = false;
          
          // Clean up existing subscription
          if (pinConfigSubscription) {
            try {
              supabase.removeChannel(pinConfigSubscription);
            } catch (e) {
              console.error('Error removing pin config channel:', e);
            }
            pinConfigSubscription = null;
          }
          
          // Attempt to reconnect
          handleReconnection('pin-configs', () => {
            subscribeToPinConfigs(callback);
          });
        }
      });

    return () => {
      if (pinConfigSubscription) {
        console.log('Unsubscribing from pin configs channel');
        try {
          supabase.removeChannel(pinConfigSubscription);
        } catch (e) {
          console.error('Error removing pin config channel during cleanup:', e);
        }
        pinConfigSubscription = null;
      }
    };
  } catch (error) {
    console.error('Error setting up pin config subscription:', error);
    toast.error('Failed to setup pin configuration monitoring');
    pinConfigSubscription = null;
    
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
    toast.error('Realtime service unavailable');
    return () => {};
  }
  
  // If already subscribed, return the unsubscribe function
  if (pinDataSubscription) {
    console.log('Already subscribed to pin data channel');
    return () => {
      if (pinDataSubscription) {
        console.log('Removing existing pin data subscription');
        try {
          supabase.removeChannel(pinDataSubscription);
        } catch (e) {
          console.error('Error removing pin data channel:', e);
        }
        pinDataSubscription = null;
      }
    };
  }

  try {
    console.log('Setting up pin data subscription');
    pinDataSubscription = supabase
      .channel('pin-data-changes')
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
        console.log('Pin data subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to pin data changes');
          isWebSocketConnected = true;
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to pin data:', status);
          toast.error('Pin data connection lost. Reconnecting...');
          isWebSocketConnected = false;
          
          // Clean up existing subscription
          if (pinDataSubscription) {
            try {
              supabase.removeChannel(pinDataSubscription);
            } catch (e) {
              console.error('Error removing pin data channel:', e);
            }
            pinDataSubscription = null;
          }
          
          // Attempt to reconnect
          handleReconnection('pin-data', () => {
            subscribeToPinData(callback);
          });
        }
      });

    return () => {
      if (pinDataSubscription) {
        console.log('Unsubscribing from pin data channel');
        try {
          supabase.removeChannel(pinDataSubscription);
        } catch (e) {
          console.error('Error removing pin data channel during cleanup:', e);
        }
        pinDataSubscription = null;
      }
    };
  } catch (error) {
    console.error('Error setting up pin data subscription:', error);
    toast.error('Failed to setup pin data monitoring');
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
  try {
    if (deviceSubscription) {
      console.log('Unsubscribing from devices channel');
      try {
        supabase.removeChannel(deviceSubscription);
      } catch (e) {
        console.error('Error removing device channel during unsubscribeAll:', e);
      }
      deviceSubscription = null;
    }
    
    if (pinConfigSubscription) {
      console.log('Unsubscribing from pin configs channel');
      try {
        supabase.removeChannel(pinConfigSubscription);
      } catch (e) {
        console.error('Error removing pin config channel during unsubscribeAll:', e);
      }
      pinConfigSubscription = null;
    }
    
    if (pinDataSubscription) {
      console.log('Unsubscribing from pin data channel');
      try {
        supabase.removeChannel(pinDataSubscription);
      } catch (e) {
        console.error('Error removing pin data channel during unsubscribeAll:', e);
      }
      pinDataSubscription = null;
    }
    
    console.log('Successfully unsubscribed from all channels');
  } catch (error) {
    console.error('Error unsubscribing from channels:', error);
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
