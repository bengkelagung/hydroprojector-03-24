
import React, { memo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { ChartDataPoint } from '@/utils/pin-history';

interface PinHistoryChartProps {
  historyData: ChartDataPoint[];
  dataKey?: string;
  isDigital?: boolean;
  color?: string;
}

/**
 * Chart component to visualize pin history data with maximum performance optimizations
 */
const PinHistoryChart: React.FC<PinHistoryChartProps> = ({
  historyData,
  dataKey = 'value',
  isDigital = false,
  color = '#3b82f6'
}) => {
  // Immediately check for empty data to avoid unnecessary processing
  if (!historyData || historyData.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No history data available</p>
      </div>
    );
  }

  // Show a warning for extreme data volume rather than attempting to render
  if (historyData.length > 200) { // Reduced threshold from 300 to 200
    return (
      <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-amber-600 font-medium">Too much data to display</p>
        <p className="text-gray-500 text-sm">Try selecting a shorter time range</p>
      </div>
    );
  }

  // Process data with maximum optimization
  const processData = (): ChartDataPoint[] => {
    // Hard limit on data points - extreme reduction for performance
    const maxPoints = 5; // Further reduced from 10 to 5 for maximum performance
    
    if (historyData.length <= maxPoints) {
      return historyData;
    }
    
    // For large datasets, use aggressive sampling
    const sampledData: ChartDataPoint[] = [];
    
    // Always include first point
    sampledData.push(historyData[0]);
    
    // For digital signals, just include transitions and limit to maxPoints
    if (isDigital) {
      let lastValue = historyData[0].value;
      
      // Include only critical transition points
      for (let i = 1; i < historyData.length - 1; i++) {
        if (historyData[i].value !== lastValue && sampledData.length < maxPoints - 1) {
          sampledData.push(historyData[i]);
          lastValue = historyData[i].value;
        }
      }
    } else {
      // For analog signals, select points evenly
      const interval = Math.floor(historyData.length / (maxPoints - 1));
      for (let i = interval; i < historyData.length - interval; i += interval) {
        if (sampledData.length < maxPoints - 1) {
          sampledData.push(historyData[i]);
        }
      }
    }
    
    // Always include last point
    if (historyData.length > 1) {
      sampledData.push(historyData[historyData.length - 1]);
    }
    
    return sampledData;
  };
  
  const processedData = processData();

  const chartConfig = {
    [dataKey]: {
      label: dataKey,
      color: color
    }
  };

  return (
    <ChartContainer config={chartConfig} className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={processedData} 
          margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
          <XAxis 
            dataKey="time" 
            fontSize={8}
            tickMargin={3}
            interval="preserveStartEnd"
            tickCount={2} // Show only 2 ticks
          />
          <YAxis 
            fontSize={8}
            domain={isDigital ? [0, 1] : ['auto', 'auto']}
            tickFormatter={(value) => isDigital ? (value === 1 ? 'ON' : 'OFF') : value.toString()}
            width={20}
            tickCount={2} // Show only 2 ticks
          />
          <Tooltip content={<ChartTooltip />} />
          <Line 
            type={isDigital ? "stepAfter" : "monotone"} 
            dataKey={dataKey} 
            stroke={color} 
            dot={false} // Disable dots for better performance
            isAnimationActive={false} // Disable animations
            strokeWidth={1} // Use thin lines
            connectNulls={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// Use React.memo for component memoization to prevent unnecessary re-renders
export default memo(PinHistoryChart);

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
