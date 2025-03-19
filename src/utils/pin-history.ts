
import { supabase } from '@/integrations/supabase/client';

export interface PinHistoryEntry {
  id: string;
  pin_id: string;
  value: string;
  created_at: string;
}

export interface PinHistoryData {
  times: string[];
  values: (number | string)[];
}

/**
 * Fetch historical data for a pin
 * @param pinId The ID of the pin
 * @param timeRange 'hour', 'day', 'week', 'month'
 * @returns Array of pin data entries
 */
export const fetchPinHistory = async (
  pinId: string, 
  timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'
): Promise<PinHistoryEntry[]> => {
  // Calculate the start date based on time range
  const now = new Date();
  let startDate = new Date(now);
  
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
      .eq('pin_id', pinId)
      .gte('created_at', startDateString)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching pin history:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchPinHistory:', error);
    return [];
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
  const times = historyData.map(entry => {
    const date = new Date(entry.created_at);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  });
  
  const values = historyData.map(entry => {
    if (isDigital) {
      // For digital pins, return 1 or 0
      return entry.value === '1' ? 1 : 0;
    } else {
      // For analog pins, parse the value to a number
      return parseFloat(entry.value) || 0;
    }
  });
  
  return { times, values };
};
