import { supabase } from '@/integrations/supabase/client';

export interface PinHistoryEntry {
  id: string;
  pin_config_id: string;
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
 * Ultra lightweight fetch for pin history - only gets first and last point
 */
export const fetchPinHistory = async (
  pinId: string, 
  timeRange: 'hour' | 'day' | 'week' | 'month' | 'all' = 'day'
): Promise<PinHistoryEntry[]> => {
  try {
    // Always get just 2 points (first and last in the time period)
    // regardless of time range to prevent UI freezing
    const now = new Date();
    let startDate = new Date(now);
    
    // Calculate the start date based on time range
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
      case 'all':
        // Do nothing, get all time range
        break;
    }

    // Format for Postgres timestamp comparison
    const startDateString = startDate.toISOString();
    
    // Get only first point in time range
    const { data: firstPoint, error: firstError } = await supabase
      .from('pin_data')
      .select('*')
      .eq('pin_config_id', pinId)
      .gte('created_at', startDateString)
      .order('created_at', { ascending: true })
      .limit(1);
      
    if (firstError) {
      console.error('Error fetching first pin history point:', firstError);
      return [];
    }
    
    // Get only last point in time range
    const { data: lastPoint, error: lastError } = await supabase
      .from('pin_data')
      .select('*')
      .eq('pin_config_id', pinId)
      .gte('created_at', startDateString)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (lastError) {
      console.error('Error fetching last pin history point:', lastError);
      return [];
    }
    
    // If we have both points and they're different, return both
    if (firstPoint && firstPoint.length > 0 && 
        lastPoint && lastPoint.length > 0 &&
        firstPoint[0].id !== lastPoint[0].id) {
      return [...firstPoint, ...lastPoint];
    }
    
    // Otherwise return whichever we have
    return [...(firstPoint || []), ...(lastPoint || [])];
  } catch (error) {
    console.error('Error in fetchPinHistory:', error);
    return [];
  }
};

/**
 * Format pin history data for charts - only returns the raw minimum data needed
 */
export const formatPinHistoryForChart = (
  historyData: PinHistoryEntry[],
  isDigital: boolean = false
): PinHistoryData => {
  // Just use the data as is - we've already limited it at the source
  const times = historyData.map(entry => formatTimeString(new Date(entry.created_at)));
  const values = historyData.map(entry => formatValue(entry.value, isDigital));
  
  return { times, values };
};

/**
 * Format pin history data for Recharts - only processes the minimum required
 */
export const formatPinHistoryForRecharts = (
  historyData: PinHistoryEntry[],
  isDigital: boolean = false,
  label: string = 'Value'
): ChartDataPoint[] => {
  // Just use the data as is - we've already limited it at the source
  return historyData.map(entry => createDataPoint(entry, isDigital, label));
};

// Helper functions
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

/**
 * Ultra-optimized history data fetching for charts - only returns 2 points
 * to minimize data processing and prevent freezing
 */
export const getPinHistoryData = async (pinId: string, hours: number = 24) => {
  try {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);
    
    // Get first point in time range
    const { data: firstPoint, error: firstError } = await supabase
      .from('pin_data')
      .select('id, pin_config_id, value, created_at')
      .eq('pin_config_id', pinId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })
      .limit(1);
    
    if (firstError) {
      console.error('Error fetching first pin history point:', firstError);
      return [];
    }
    
    // Get last point in time range
    const { data: lastPoint, error: lastError } = await supabase
      .from('pin_data')
      .select('id, pin_config_id, value, created_at')
      .eq('pin_config_id', pinId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (lastError) {
      console.error('Error fetching last pin history point:', lastError);
      return [];
    }
    
    // Combine points and format them
    const combined = [
      ...(firstPoint || []).map(item => ({
        time: new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        value: parseFloat(item.value || '0'),
        timestamp: new Date(item.created_at).getTime()
      })),
      ...(lastPoint || []).filter(lp => 
        !firstPoint || !firstPoint.length || lp.id !== firstPoint[0].id
      ).map(item => ({
        time: new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        value: parseFloat(item.value || '0'),
        timestamp: new Date(item.created_at).getTime()
      }))
    ];
    
    return combined;
  } catch (error) {
    console.error('Error in getPinHistoryData:', error);
    return [];
  }
};
