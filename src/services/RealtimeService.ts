
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

// Connection status
let isConnecting = false;
const reconnectDelayMs = 5000; // 5 seconds between reconnection attempts

// Helper function to handle reconnection with exponential backoff
const handleReconnection = (channelName: string, callback: () => void) => {
  if (isConnecting) return;
  
  isConnecting = true;
  console.log(`Attempting to reconnect to ${channelName}...`);
  
  setTimeout(() => {
    callback();
    isConnecting = false;
  }, reconnectDelayMs);
};

// Subscribe to device changes
export const subscribeToDevices = (callback: DeviceUpdateCallback) => {
  // If already subscribing, don't create a new subscription
  if (deviceSubscription) {
    console.log('Already subscribed to devices channel');
    return () => {
      if (deviceSubscription) {
        console.log('Removing existing devices subscription');
        supabase.removeChannel(deviceSubscription);
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
        if (status !== 'SUBSCRIBED') {
          console.error('Failed to subscribe to devices:', status);
          // Attempt to reconnect if connection is closed
          if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            toast.error('Device connection lost. Reconnecting...');
            handleReconnection('devices', () => {
              if (deviceSubscription) {
                supabase.removeChannel(deviceSubscription);
                deviceSubscription = null;
              }
              subscribeToDevices(callback);
            });
          }
        } else {
          console.log('Subscribed to devices changes');
        }
      });

    return () => {
      if (deviceSubscription) {
        console.log('Unsubscribing from devices channel');
        supabase.removeChannel(deviceSubscription);
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
  // If already subscribed, return the unsubscribe function
  if (pinConfigSubscription) {
    console.log('Already subscribed to pin configs channel');
    return () => {
      if (pinConfigSubscription) {
        console.log('Removing existing pin configs subscription');
        supabase.removeChannel(pinConfigSubscription);
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
        if (status !== 'SUBSCRIBED') {
          console.error('Failed to subscribe to pin configs:', status);
          // Attempt to reconnect if connection is closed
          if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            toast.error('Pin configuration connection lost. Reconnecting...');
            handleReconnection('pin-configs', () => {
              if (pinConfigSubscription) {
                supabase.removeChannel(pinConfigSubscription);
                pinConfigSubscription = null;
              }
              subscribeToPinConfigs(callback);
            });
          }
        } else {
          console.log('Subscribed to pin config changes');
        }
      });

    return () => {
      if (pinConfigSubscription) {
        console.log('Unsubscribing from pin configs channel');
        supabase.removeChannel(pinConfigSubscription);
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
  // If already subscribed, return the unsubscribe function
  if (pinDataSubscription) {
    console.log('Already subscribed to pin data channel');
    return () => {
      if (pinDataSubscription) {
        console.log('Removing existing pin data subscription');
        supabase.removeChannel(pinDataSubscription);
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
        if (status !== 'SUBSCRIBED') {
          console.error('Failed to subscribe to pin data:', status);
          // Attempt to reconnect if connection is closed
          if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            toast.error('Pin data connection lost. Reconnecting...');
            handleReconnection('pin-data', () => {
              if (pinDataSubscription) {
                supabase.removeChannel(pinDataSubscription);
                pinDataSubscription = null;
              }
              subscribeToPinData(callback);
            });
          }
        } else {
          console.log('Subscribed to pin data changes');
        }
      });

    return () => {
      if (pinDataSubscription) {
        console.log('Unsubscribing from pin data channel');
        supabase.removeChannel(pinDataSubscription);
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
    const { data, error } = await supabase.from('pin_configs').select('id').limit(1);
    
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

// Helper function to unsubscribe from all channels
export const unsubscribeAll = () => {
  try {
    if (deviceSubscription) {
      console.log('Unsubscribing from devices channel');
      supabase.removeChannel(deviceSubscription);
      deviceSubscription = null;
    }
    
    if (pinConfigSubscription) {
      console.log('Unsubscribing from pin configs channel');
      supabase.removeChannel(pinConfigSubscription);
      pinConfigSubscription = null;
    }
    
    if (pinDataSubscription) {
      console.log('Unsubscribing from pin data channel');
      supabase.removeChannel(pinDataSubscription);
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
