
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
  if (historyData.length > 50) { // Drastically reduced threshold from 100 to 50
    return (
      <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-amber-600 font-medium">Too much data to display</p>
        <p className="text-gray-500 text-sm">Try selecting a shorter time range</p>
      </div>
    );
  }

  // Extremely optimized data processing with severe data reduction
  const processedData = useMemo(() => {
    // Maximum 2 data points to guarantee performance - only start and end
    const maxPoints = 2;
    
    if (historyData.length <= maxPoints) {
      return historyData;
    }
    
    // For all datasets, use only two points: first and last
    const sampledData: ChartDataPoint[] = [];
    
    // Always include first point
    sampledData.push(historyData[0]);
    
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
          {/* Further reduced opacity of grid to improve rendering performance */}
          <CartesianGrid strokeDasharray="3 3" opacity={0.03} vertical={false} />
          <XAxis 
            dataKey="time" 
            fontSize={7}
            tickMargin={3}
            interval="preserveStartEnd"
            tickCount={2} // Only show first and last tick
          />
          <YAxis 
            fontSize={7}
            domain={isDigital ? [0, 1] : ['auto', 'auto']}
            tickFormatter={(value) => isDigital ? (value === 1 ? 'ON' : 'OFF') : value.toString()}
            width={15}
            tickCount={2} // Only show min and max ticks
          />
          <Tooltip content={<ChartTooltip />} />
          <Line 
            type={isDigital ? "stepAfter" : "linear"} 
            dataKey={dataKey} 
            stroke={color} 
            dot={false} // Disable dots completely
            isAnimationActive={false} // Disable all animations
            strokeWidth={1} // Use thin lines for minimal rendering
            connectNulls={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// Use React.memo to prevent unnecessary re-renders with a strict comparison
export default memo(PinHistoryChart, (prevProps, nextProps) => {
  // Custom comparison - only rerender if historyData length changes or is completely different
  if (prevProps.historyData === nextProps.historyData) return true;
  
  // If data length is the same and both have data, consider them equal for rendering purposes
  // This prevents minor data updates from triggering re-renders
  if (prevProps.historyData.length === nextProps.historyData.length && 
      prevProps.historyData.length > 0) {
    return true;
  }
  
  return false;
});

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
