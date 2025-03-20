
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { ChartDataPoint } from '@/utils/pin-history';

interface PinHistoryChartProps {
  historyData: ChartDataPoint[];
  dataKey?: string;
  isDigital?: boolean;
  color?: string;
}

/**
 * Chart component to visualize pin history data
 */
const PinHistoryChart: React.FC<PinHistoryChartProps> = ({
  historyData,
  dataKey = 'value',
  isDigital = false,
  color = '#3b82f6'
}) => {
  // Use useMemo to prevent unnecessary re-renders
  const processedData = useMemo(() => {
    if (!historyData || historyData.length === 0) return [];
    
    // Limit data points to prevent browser freezing
    const maxDataPoints = 100;
    let dataToUse = historyData;
    
    if (historyData.length > maxDataPoints) {
      const interval = Math.floor(historyData.length / maxDataPoints);
      dataToUse = historyData.filter((_, index) => index % interval === 0);
      
      // Always include the last data point
      if (dataToUse[dataToUse.length - 1] !== historyData[historyData.length - 1]) {
        dataToUse.push(historyData[historyData.length - 1]);
      }
    }
    
    return dataToUse;
  }, [historyData]);
  
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
        <LineChart data={processedData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            fontSize={12}
            tickMargin={5}
            // Limit the number of displayed ticks to prevent clutter
            interval="preserveStartEnd"
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
            dot={false} // Disable dots for better performance with large datasets
            isAnimationActive={false} // Disable animation for better performance
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default PinHistoryChart;

// Export a function to make it easier to use the component
export const createPinHistoryChart = (
  historyData: ChartDataPoint[],
  dataKey: string = 'value',
  isDigital: boolean = false,
  color: string = '#3b82f6'
) => (
  <PinHistoryChart 
    historyData={historyData} 
    dataKey={dataKey} 
    isDigital={isDigital} 
    color={color} 
  />
);
