
import React from 'react';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { ChartDataPoint } from '@/utils/pin-history';

interface PinHistoryChartProps {
  historyData: ChartDataPoint[];
  dataKey?: string;
  isDigital?: boolean;
  color?: string;
}

/**
 * Ultra-lightweight chart component that prevents UI freezing
 * Only shows two points maximum to avoid any performance issues
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

  // Only use the first and last point to prevent freezing
  const firstPoint = historyData[0];
  const lastPoint = historyData.length > 1 ? historyData[historyData.length - 1] : null;

  const chartConfig = {
    [dataKey]: {
      label: dataKey,
      color: color
    }
  };

  return (
    <ChartContainer config={chartConfig} className="h-40 w-full">
      <div className="h-full w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        {/* Super simple visualization to prevent freezing */}
        <div className="text-center">
          <div className="text-xs text-gray-500">{firstPoint.time}</div>
          <div className="text-sm font-medium mt-1" style={{ color }}>
            {isDigital 
              ? (firstPoint.value === 1 ? 'ON' : 'OFF') 
              : firstPoint.value}
          </div>
        </div>

        {lastPoint && (
          <>
            <div className="h-0.5 flex-1 mx-4" style={{ backgroundColor: `${color}40` }}></div>
            <div className="text-center">
              <div className="text-xs text-gray-500">{lastPoint.time}</div>
              <div className="text-sm font-medium mt-1" style={{ color }}>
                {isDigital 
                  ? (lastPoint.value === 1 ? 'ON' : 'OFF') 
                  : lastPoint.value}
              </div>
            </div>
          </>
        )}
      </div>
    </ChartContainer>
  );
};

export default React.memo(PinHistoryChart);

// Simple factory function that doesn't use Recharts
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
