
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';

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
    // If 'all' is selected, don't filter by date
    try {
      const { data, error } = await supabase
        .from('pin_data')
        .select('*')
        .eq('pin_config_id', pinId)
        .order('created_at', { ascending: true });
        
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
        .order('created_at', { ascending: true });
        
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
  return historyData.map(entry => {
    const date = new Date(entry.created_at);
    const time = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    let value: number | string;
    if (isDigital) {
      // For digital pins, return 1 or 0
      value = entry.value === '1' ? 1 : 0;
    } else {
      // For analog pins, parse the value to a number
      value = parseFloat(entry.value) || 0;
    }
    
    return {
      time,
      [label]: value,
      value, // Keep a generic value field for easier access
      timestamp: entry.created_at
    };
  });
};

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

/**
 * Create a history chart component for a pin
 * @param historyData Formatted history data for Recharts
 * @param dataKey The key to use for the data series
 * @param isDigital Whether the pin is digital (on/off)
 * @param color Chart line color (optional)
 * @returns JSX Element with the chart
 */
export const createPinHistoryChart = (
  historyData: ChartDataPoint[],
  dataKey: string = 'value',
  isDigital: boolean = false,
  color: string = '#3b82f6'
) => {
  if (!historyData || historyData.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No history data available</p>
      </div>
    );
  }

  const chartConfig = {
    [dataKey]: {
      label: dataKey,
      color: color
    }
  };

  return (
    <ChartContainer config={chartConfig} className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={historyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            fontSize={12}
            tickMargin={5}
          />
          <YAxis 
            fontSize={12}
            domain={isDigital ? [0, 1] : ['auto', 'auto']}
            tickFormatter={(value) => isDigital ? (value === 1 ? 'ON' : 'OFF') : value.toString()}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            activeDot={{ r: 8 }} 
            dot={{ r: 3 }}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
