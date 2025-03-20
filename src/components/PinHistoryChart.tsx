
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
 */
const PinHistoryChart: React.FC<PinHistoryChartProps> = ({
  historyData,
  dataKey = 'value',
  isDigital = false,
  color = '#3b82f6'
}) => {
  // Empty data check
  if (!historyData || historyData.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No history data available</p>
      </div>
    );
  }

  // Strict limit on data points to prevent freezing
  if (historyData.length > 10) {
    return (
      <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-amber-600 font-medium">Too much data to display</p>
        <p className="text-gray-500 text-sm">Try selecting a shorter time range</p>
      </div>
    );
  }

  // Super minimal data processing - just first and last point
  const processedData = useMemo(() => {
    if (historyData.length <= 2) return historyData;
    
    return [
      historyData[0],
      historyData[historyData.length - 1]
    ];
  }, [historyData]);

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
          <CartesianGrid strokeDasharray="3 3" opacity={0.02} vertical={false} />
          <XAxis 
            dataKey="time" 
            fontSize={7}
            tickMargin={3}
            tickCount={2} // Only first and last tick
          />
          <YAxis 
            fontSize={7}
            domain={isDigital ? [0, 1] : ['auto', 'auto']}
            tickFormatter={(value) => isDigital ? (value === 1 ? 'ON' : 'OFF') : value.toString()}
            width={15}
            tickCount={2} // Only min and max ticks
          />
          <Tooltip content={<ChartTooltip />} />
          <Line 
            type="linear" // Simplest line type for performance
            dataKey={dataKey} 
            stroke={color} 
            dot={false} // No dots
            isAnimationActive={false} // No animations
            strokeWidth={1} // Thin line
            connectNulls={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default memo(PinHistoryChart, (prevProps, nextProps) => {
  // Only re-render if data array reference changes completely
  return prevProps.historyData === nextProps.historyData;
});

// Simple factory function
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
