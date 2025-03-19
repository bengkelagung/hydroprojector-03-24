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

// Subscribe to device changes
export const subscribeToDevices = (callback: DeviceUpdateCallback) => {
  if (deviceSubscription) return;

  deviceSubscription = supabase
    .channel('devices-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'devices' },
      (payload) => {
        console.log('Devices change received:', payload);
        
        if (payload.eventType === 'UPDATE') {
          callback(payload.new.id, payload.new);
        } else if (payload.eventType === 'DELETE') {
          // Force refresh on device deletion
          window.location.reload();
        } else if (payload.eventType === 'INSERT') {
          // Force refresh on new device
          window.location.reload();
        }
      }
    )
    .subscribe((status) => {
      if (status !== 'SUBSCRIBED') {
        console.error('Failed to subscribe to devices:', status);
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
};

// Subscribe to pin configuration changes
export const subscribeToPinConfigs = (callback: PinUpdateCallback) => {
  if (pinConfigSubscription) return;

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
          // Handle deletions and insertions by forcing a refresh of pins data
          window.location.reload();
        }
      }
    )
    .subscribe((status) => {
      if (status !== 'SUBSCRIBED') {
        console.error('Failed to subscribe to pin configs:', status);
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
};

// Subscribe to pin data changes
export const subscribeToPinData = (callback: PinDataCallback) => {
  if (pinDataSubscription) return;

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
};

// Helper function to unsubscribe from all channels
export const unsubscribeAll = () => {
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
};
