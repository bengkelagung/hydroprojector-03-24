
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
 * Chart component to visualize pin history data with optimized performance
 */
const PinHistoryChart: React.FC<PinHistoryChartProps> = ({
  historyData,
  dataKey = 'value',
  isDigital = false,
  color = '#3b82f6'
}) => {
  // Use useMemo to prevent unnecessary re-renders with stronger data reduction
  const processedData = useMemo(() => {
    if (!historyData || historyData.length === 0) return [];
    
    // More aggressive limiting of data points to prevent freezing
    const maxDataPoints = 30; // Further reduced from 50
    let dataToUse = historyData;
    
    if (historyData.length > maxDataPoints) {
      const interval = Math.ceil(historyData.length / maxDataPoints);
      
      // Use a more efficient sampling method
      const sampledData: ChartDataPoint[] = [];
      for (let i = 0; i < historyData.length; i += interval) {
        sampledData.push(historyData[i]);
      }
      
      // Always include the first and last data points for accuracy
      if (sampledData[0] !== historyData[0]) {
        sampledData.unshift(historyData[0]);
      }
      
      if (sampledData[sampledData.length - 1] !== historyData[historyData.length - 1]) {
        sampledData.push(historyData[historyData.length - 1]);
      }
      
      dataToUse = sampledData;
    }
    
    // Apply a second-level optimization for very large datasets
    // This uses data summarization (min/max/avg) for segments to preserve visual trends
    if (dataToUse.length > 20) { // Reduced threshold further
      const segmentSize = Math.ceil(dataToUse.length / 20);
      const summarizedData: ChartDataPoint[] = [];
      
      for (let i = 0; i < dataToUse.length; i += segmentSize) {
        const segment = dataToUse.slice(i, i + segmentSize);
        
        // For digital signals, we want to preserve state changes
        if (isDigital) {
          // For digital, include only state transitions
          if (segment.length > 0) summarizedData.push(segment[0]);
          
          for (let j = 1; j < segment.length; j++) {
            if (segment[j-1].value !== segment[j].value) {
              summarizedData.push(segment[j]);
            }
          }
        } else {
          // For analog, use min, max and a middle point to preserve trends
          if (segment.length > 0) {
            summarizedData.push(segment[0]); // Always add first point
            
            // If segment has more than 3 points, add a middle point
            if (segment.length > 3) {
              const midIndex = Math.floor(segment.length / 2);
              summarizedData.push(segment[midIndex]);
            }
            
            // Add last point of segment
            if (segment.length > 1) {
              summarizedData.push(segment[segment.length - 1]);
            }
          }
        }
      }
      
      // Always ensure first and last points are included
      if (summarizedData.length > 0 && summarizedData[0] !== dataToUse[0]) {
        summarizedData.unshift(dataToUse[0]);
      }
      
      if (summarizedData.length > 0 && 
          summarizedData[summarizedData.length - 1] !== dataToUse[dataToUse.length - 1]) {
        summarizedData.push(dataToUse[dataToUse.length - 1]);
      }
      
      if (summarizedData.length > 0) {
        dataToUse = summarizedData;
      }
    }
    
    return dataToUse;
  }, [historyData, isDigital]);
  
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
        <LineChart 
          data={processedData} 
          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
          <XAxis 
            dataKey="time" 
            fontSize={12}
            tickMargin={5}
            interval="preserveStartEnd"
            tick={{ fontSize: 10 }}
            minTickGap={30}
            tickCount={5}
          />
          <YAxis 
            fontSize={12}
            domain={isDigital ? [0, 1] : ['auto', 'auto']}
            tickFormatter={(value) => isDigital ? (value === 1 ? 'ON' : 'OFF') : value.toString()}
            width={40}
            tick={{ fontSize: 10 }}
            tickCount={5}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend />
          <Line 
            type={isDigital ? "stepAfter" : "monotone"} 
            dataKey={dataKey} 
            stroke={color} 
            activeDot={{ r: 3 }} // Reduced size further
            dot={false} // Disable dots for better performance
            isAnimationActive={false} // Disable animation for better performance
            strokeWidth={1.2} // Reduced line thickness further
            connectNulls={true} // Connect across null/missing values
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
