
import { supabase } from '@/integrations/supabase/client';

export interface PinHistoryEntry {
  id: string;
  pin_config_id: string;  // Matches database structure
  value: string;
  created_at: string;
}

export interface PinHistoryData {
  times: string[];
  values: (number | string)[];
}

export interface ChartDataPoint {
  time: string;
  value: number | string;
  [key: string]: any;
}

/**
 * Fetch historical data for a pin
 * @param pinId The ID of the pin
 * @param timeRange 'hour', 'day', 'week', 'month', 'all'
 * @returns Array of pin data entries
 */
export const fetchPinHistory = async (
  pinId: string, 
  timeRange: 'hour' | 'day' | 'week' | 'month' | 'all' = 'day'
): Promise<PinHistoryEntry[]> => {
  // Calculate the start date based on time range
  const now = new Date();
  let startDate = new Date(now);
  
  if (timeRange === 'all') {
    // If 'all' is selected, don't filter by date but limit results
    try {
      const { data, error } = await supabase
        .from('pin_data')
        .select('*')
        .eq('pin_config_id', pinId)
        .order('created_at', { ascending: true })
        .limit(10); // Ultra-aggressive limit to prevent freezing
        
      if (error) {
        console.error('Error fetching pin history:', error);
        throw error;
      }
      
      return data as PinHistoryEntry[] || [];
    } catch (error) {
      console.error('Error in fetchPinHistory:', error);
      return [];
    }
  } else {
    // Handle other time ranges
    switch (timeRange) {
      case 'hour':
        startDate.setHours(now.getHours() - 1);
        break;
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    // Format for Postgres timestamp comparison
    const startDateString = startDate.toISOString();
    
    try {
      const { data, error } = await supabase
        .from('pin_data')
        .select('*')
        .eq('pin_config_id', pinId)
        .gte('created_at', startDateString)
        .order('created_at', { ascending: true })
        .limit(10); // Ultra-aggressive limit to prevent freezing
        
      if (error) {
        console.error('Error fetching pin history:', error);
        throw error;
      }
      
      return data as PinHistoryEntry[] || [];
    } catch (error) {
      console.error('Error in fetchPinHistory:', error);
      return [];
    }
  }
};

/**
 * Format pin history data for use with charts
 * @param historyData Raw pin history data
 * @param isDigital Whether the pin is digital (on/off)
 * @returns Formatted data for charts
 */
export const formatPinHistoryForChart = (
  historyData: PinHistoryEntry[],
  isDigital: boolean = false
): PinHistoryData => {
  // If we have too many points, just use first and last point
  if (historyData.length > 10) {
    const first = historyData[0];
    const last = historyData[historyData.length - 1];
    
    const times = [
      formatTimeString(new Date(first.created_at)),
      formatTimeString(new Date(last.created_at))
    ];
    
    const values = [
      formatValue(first.value, isDigital),
      formatValue(last.value, isDigital)
    ];
    
    return { times, values };
  }
  
  const times = historyData.map(entry => formatTimeString(new Date(entry.created_at)));
  
  const values = historyData.map(entry => formatValue(entry.value, isDigital));
  
  return { times, values };
};

/**
 * Format pin history data for use with Recharts
 * @param historyData Raw pin history data
 * @param isDigital Whether the pin is digital (on/off)
 * @param label Optional label for the data series
 * @returns Array of data points for Recharts
 */
export const formatPinHistoryForRecharts = (
  historyData: PinHistoryEntry[],
  isDigital: boolean = false,
  label: string = 'Value'
): ChartDataPoint[] => {
  // If we have too many points, just use first and last point for best performance
  if (historyData.length > 10) {
    const first = historyData[0];
    const last = historyData[historyData.length - 1];
    
    return [
      createDataPoint(first, isDigital, label),
      createDataPoint(last, isDigital, label)
    ];
  }
  
  return historyData.map(entry => createDataPoint(entry, isDigital, label));
};

// Helper functions to reduce code duplication and optimize performance
function formatTimeString(date: Date): string {
  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function formatValue(value: string, isDigital: boolean): number | string {
  if (isDigital) {
    return value === '1' ? 1 : 0;
  } else {
    return parseFloat(value) || 0;
  }
}

function createDataPoint(
  entry: PinHistoryEntry, 
  isDigital: boolean, 
  label: string
): ChartDataPoint {
  const date = new Date(entry.created_at);
  const time = formatTimeString(date);
  const value = formatValue(entry.value, isDigital);
  
  return {
    time,
    [label]: value,
    value,
    timestamp: entry.created_at
  };
}

/**
 * Save pin state to history
 * @param pinId The ID of the pin
 * @param value The value to save
 * @returns Success status
 */
export const savePinStateToHistory = async (
  pinId: string,
  value: string
): Promise<boolean> => {
  try {
    if (!pinId) {
      console.error('Pin ID is required to save state');
      return false;
    }

    const { error } = await supabase
      .from('pin_data')
      .insert({
        pin_config_id: pinId,
        value: value,
        created_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('Error saving pin state to history:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in savePinStateToHistory:', error);
    return false;
  }
};
