
import React from 'react';
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
 * Chart component to visualize pin history data with optimized performance
 */
const PinHistoryChart: React.FC<PinHistoryChartProps> = ({
  historyData,
  dataKey = 'value',
  isDigital = false,
  color = '#3b82f6'
}) => {
  // Process data immediately without useMemo to avoid reference errors
  const processData = (inputData: ChartDataPoint[]): ChartDataPoint[] => {
    if (!inputData || inputData.length === 0) return [];
    
    // Extreme data reduction for large datasets
    const maxDataPoints = 20; // Reduced further from 30
    let dataToUse = inputData;
    
    if (inputData.length > maxDataPoints) {
      const interval = Math.ceil(inputData.length / maxDataPoints);
      const sampledData: ChartDataPoint[] = [];
      
      // Take first point
      sampledData.push(inputData[0]);
      
      // Sample middle points evenly
      for (let i = interval; i < inputData.length - interval; i += interval) {
        sampledData.push(inputData[i]);
      }
      
      // Take last point
      if (inputData.length > 1) {
        sampledData.push(inputData[inputData.length - 1]);
      }
      
      dataToUse = sampledData;
    }
    
    // For digital signals, preserve transitions by adding points before and after changes
    if (isDigital && dataToUse.length > 1) {
      const transitionPreservingData: ChartDataPoint[] = [dataToUse[0]];
      
      for (let i = 1; i < dataToUse.length; i++) {
        const prevValue = dataToUse[i-1].value;
        const currValue = dataToUse[i].value;
        
        // If there's a state change, add both points to preserve the transition
        if (prevValue !== currValue) {
          transitionPreservingData.push(dataToUse[i]);
        } else if (i % 2 === 0) { // Only add every other point for unchanged values
          transitionPreservingData.push(dataToUse[i]);
        }
      }
      
      // Ensure last point is included
      const lastIndex = dataToUse.length - 1;
      if (transitionPreservingData[transitionPreservingData.length - 1] !== dataToUse[lastIndex]) {
        transitionPreservingData.push(dataToUse[lastIndex]);
      }
      
      return transitionPreservingData.length > 0 ? transitionPreservingData : dataToUse;
    }
    
    return dataToUse;
  };
  
  const processedData = processData(historyData);
  
  if (!historyData || historyData.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No history data available</p>
      </div>
    );
  }

  // If we still have too many data points after processing, show a warning instead of rendering
  if (processedData.length > 200) {
    return (
      <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-amber-600 font-medium">Too much data to display</p>
        <p className="text-gray-500 text-sm">Try selecting a shorter time range</p>
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
        <LineChart 
          data={processedData} 
          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis 
            dataKey="time" 
            fontSize={10}
            tickMargin={5}
            interval="preserveStartEnd"
            minTickGap={50}
            tickCount={3}
          />
          <YAxis 
            fontSize={10}
            domain={isDigital ? [0, 1] : ['auto', 'auto']}
            tickFormatter={(value) => isDigital ? (value === 1 ? 'ON' : 'OFF') : value.toString()}
            width={35}
            tickCount={3}
          />
          <Tooltip content={<ChartTooltip />} />
          <Line 
            type={isDigital ? "stepAfter" : "monotone"} 
            dataKey={dataKey} 
            stroke={color} 
            dot={false}
            isAnimationActive={false}
            strokeWidth={1}
            connectNulls={true}
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
