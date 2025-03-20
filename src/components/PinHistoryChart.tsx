
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
 * Extremely lightweight chart component to visualize pin history data
 * Optimized to prevent UI freezing
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

  // Extremely aggressive limit to prevent any possible freezing
  // Only show two data points maximum (first and last)
  const simplifiedData = historyData.length <= 2 
    ? historyData 
    : [historyData[0], historyData[historyData.length - 1]];

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
          data={simplifiedData} 
          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
          <XAxis 
            dataKey="time" 
            fontSize={8}
            tickMargin={3}
            tickCount={2} // Only first and last tick
          />
          <YAxis 
            fontSize={8}
            domain={isDigital ? [0, 1] : ['auto', 'auto']}
            tickFormatter={(value) => isDigital ? (value === 1 ? 'ON' : 'OFF') : value.toString()}
            width={20}
            tickCount={2} // Only min and max ticks
          />
          <Tooltip content={<ChartTooltip />} />
          <Line 
            type="linear" 
            dataKey={dataKey} 
            stroke={color} 
            dot={{ strokeWidth: 1, r: 2 }}
            isAnimationActive={false} // No animations for performance
            strokeWidth={1.5}
            connectNulls={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default memo(PinHistoryChart);

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
