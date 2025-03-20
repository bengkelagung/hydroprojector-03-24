
import React, { memo, useMemo } from 'react';
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
 * Ultra-optimized chart component to visualize pin history data
 * with extreme performance considerations
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

  // Show a warning for even smaller data volumes to prevent any chance of freezing
  if (historyData.length > 100) { // Drastically reduced threshold from 200 to 100
    return (
      <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-amber-600 font-medium">Too much data to display</p>
        <p className="text-gray-500 text-sm">Try selecting a shorter time range</p>
      </div>
    );
  }

  // Extremely optimized data processing with severe data reduction
  const processedData = useMemo(() => {
    // Extremely aggressive data reduction - Maximum 3 data points to guarantee performance
    const maxPoints = 3;
    
    if (historyData.length <= maxPoints) {
      return historyData;
    }
    
    // For large datasets, use extremely aggressive sampling
    const sampledData: ChartDataPoint[] = [];
    
    // Always include first point
    sampledData.push(historyData[0]);
    
    // For digital signals with any amount of data points, only include first and last
    if (isDigital) {
      // Always include last point
      sampledData.push(historyData[historyData.length - 1]);
      return sampledData;
    } 
    
    // For analog signals, select exactly 1 middle point
    const middleIndex = Math.floor(historyData.length / 2);
    sampledData.push(historyData[middleIndex]);
    
    // Always include last point
    sampledData.push(historyData[historyData.length - 1]);
    
    return sampledData;
  }, [historyData, isDigital]);

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
          {/* Reduced opacity of grid to improve rendering performance */}
          <CartesianGrid strokeDasharray="3 3" opacity={0.05} vertical={false} />
          <XAxis 
            dataKey="time" 
            fontSize={8}
            tickMargin={3}
            interval="preserveStartEnd"
            tickCount={2} // Show only start and end ticks
          />
          <YAxis 
            fontSize={8}
            domain={isDigital ? [0, 1] : ['auto', 'auto']}
            tickFormatter={(value) => isDigital ? (value === 1 ? 'ON' : 'OFF') : value.toString()}
            width={20}
            tickCount={2} // Show only min and max ticks
          />
          <Tooltip content={<ChartTooltip />} />
          <Line 
            type={isDigital ? "stepAfter" : "linear"} // Changed from monotone to linear for better performance
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

// Use React.memo to prevent unnecessary re-renders
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
