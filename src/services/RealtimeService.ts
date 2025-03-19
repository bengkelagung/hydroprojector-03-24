
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

// Helper function to handle reconnection
const handleReconnection = (channelName: string, callback: () => void) => {
  console.log(`Attempting to reconnect to ${channelName}...`);
  setTimeout(() => {
    callback();
  }, 5000); // Wait 5 seconds before reconnecting
};

// Subscribe to device changes
export const subscribeToDevices = (callback: DeviceUpdateCallback) => {
  // If already subscribed, return the unsubscribe function
  if (deviceSubscription) {
    return () => {
      if (deviceSubscription) {
        supabase.removeChannel(deviceSubscription);
        deviceSubscription = null;
      }
    };
  }

  try {
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
        if (status !== 'SUBSCRIBED') {
          console.error('Failed to subscribe to devices:', status);
          // Attempt to reconnect if connection is closed
          if (status === 'CLOSED') {
            toast.error('Device connection lost. Reconnecting...');
            handleReconnection('devices', () => {
              supabase.removeChannel(deviceSubscription);
              deviceSubscription = null;
              subscribeToDevices(callback);
            });
          }
        } else {
          console.log('Subscribed to devices changes');
        }
      });

    return () => {
      if (deviceSubscription) {
        supabase.removeChannel(deviceSubscription);
        deviceSubscription = null;
      }
    };
  } catch (error) {
    console.error('Error setting up device subscription:', error);
    toast.error('Failed to setup device monitoring');
    return () => {};
  }
};

// Subscribe to pin configuration changes
export const subscribeToPinConfigs = (callback: PinUpdateCallback) => {
  // If already subscribed, return the unsubscribe function
  if (pinConfigSubscription) {
    return () => {
      if (pinConfigSubscription) {
        supabase.removeChannel(pinConfigSubscription);
        pinConfigSubscription = null;
      }
    };
  }

  try {
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
        if (status !== 'SUBSCRIBED') {
          console.error('Failed to subscribe to pin configs:', status);
          // Attempt to reconnect if connection is closed
          if (status === 'CLOSED') {
            toast.error('Pin configuration connection lost. Reconnecting...');
            handleReconnection('pin-configs', () => {
              supabase.removeChannel(pinConfigSubscription);
              pinConfigSubscription = null;
              subscribeToPinConfigs(callback);
            });
          }
        } else {
          console.log('Subscribed to pin config changes');
        }
      });

    return () => {
      if (pinConfigSubscription) {
        supabase.removeChannel(pinConfigSubscription);
        pinConfigSubscription = null;
      }
    };
  } catch (error) {
    console.error('Error setting up pin config subscription:', error);
    toast.error('Failed to setup pin configuration monitoring');
    return () => {};
  }
};

// Subscribe to pin data changes
export const subscribeToPinData = (callback: PinDataCallback) => {
  // If already subscribed, return the unsubscribe function
  if (pinDataSubscription) {
    return () => {
      if (pinDataSubscription) {
        supabase.removeChannel(pinDataSubscription);
        pinDataSubscription = null;
      }
    };
  }

  try {
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
        if (status !== 'SUBSCRIBED') {
          console.error('Failed to subscribe to pin data:', status);
          // Attempt to reconnect if connection is closed
          if (status === 'CLOSED') {
            toast.error('Pin data connection lost. Reconnecting...');
            handleReconnection('pin-data', () => {
              supabase.removeChannel(pinDataSubscription);
              pinDataSubscription = null;
              subscribeToPinData(callback);
            });
          }
        } else {
          console.log('Subscribed to pin data changes');
        }
      });

    return () => {
      if (pinDataSubscription) {
        supabase.removeChannel(pinDataSubscription);
        pinDataSubscription = null;
      }
    };
  } catch (error) {
    console.error('Error setting up pin data subscription:', error);
    toast.error('Failed to setup pin data monitoring');
    return () => {};
  }
};

// Helper function to unsubscribe from all channels
export const unsubscribeAll = () => {
  try {
    if (deviceSubscription) {
      supabase.removeChannel(deviceSubscription);
      deviceSubscription = null;
    }
    
    if (pinConfigSubscription) {
      supabase.removeChannel(pinConfigSubscription);
      pinConfigSubscription = null;
    }
    
    if (pinDataSubscription) {
      supabase.removeChannel(pinDataSubscription);
      pinDataSubscription = null;
    }
    
    console.log('Successfully unsubscribed from all channels');
  } catch (error) {
    console.error('Error unsubscribing from channels:', error);
  }
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
