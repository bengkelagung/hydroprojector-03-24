import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { ChartDataPoint } from '@/utils/pin-history';

interface PinHistoryChartProps {
  historyData: ChartDataPoint[];
  dataKey?: string;
  isDigital?: boolean;
  color?: string;
  unit?: string;
  name?: string;
}

interface ProcessedDataPoint {
  time: string;
  value: number;
}

const CustomTooltip = ({ active, payload, label, isDigital, unit }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600 font-medium mb-1">{`Time: ${label}`}</p>
        <p className="text-sm font-semibold text-blue-600">
          {isDigital 
            ? `Status: ${value === 1 ? 'ON' : 'OFF'}`
            : `Value: ${value.toFixed(2)}${unit ? ` ${unit}` : ''}`
          }
        </p>
      </div>
    );
  }
  return null;
};

const PinHistoryChart: React.FC<PinHistoryChartProps> = ({
  historyData,
  dataKey = 'value',
  isDigital = false,
  color = '#3b82f6',
  unit = '',
  name = 'Sensor Value'
}) => {
  // Empty data check
  if (!historyData || historyData.length === 0) {
    return (
      <div className="flex items-center justify-center h-60 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <p className="text-gray-500 font-medium">No history data available</p>
          <p className="text-gray-400 text-sm mt-1">Data will appear here once collected</p>
        </div>
      </div>
    );
  }

  // Process data for better visualization
  const chartData: ProcessedDataPoint[] = historyData
    .filter((_, index) => {
      // For 30-day view (more than 2016 points - 7 days * 288 points)
      if (historyData.length > 2016) {
        // Keep every 8th point
        return index % 8 === 0;
      }
      // For 7-day view (more than 288 points - 24 hours)
      if (historyData.length > 288) {
        // Keep every 4th point
        return index % 4 === 0;
      }
      return true; // Keep all points for 24-hour view
    })
    .map(point => ({
      time: point.time,
      value: isDigital 
        ? (point.value === '1' || point.value === 1 ? 1 : 0)
        : typeof point.value === 'string' 
          ? parseFloat(point.value || '0') 
          : point.value || 0
    }));

  // Calculate min and max for Y axis
  const values = chartData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = isDigital ? 0.2 : (maxValue - minValue) * 0.1;

  // Calculate nice rounded values for Y axis
  const yMin = isDigital ? -0.2 : Math.floor(minValue - padding);
  const yMax = isDigital ? 1.2 : Math.ceil(maxValue + padding);

  return (
    <div className="w-full h-[250px] bg-white rounded-lg border border-gray-200 p-4 transition-all duration-200 hover:shadow-lg">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={chartData} 
          margin={{ 
            top: 10,
            right: 10,
            left: -60,
            bottom: 0
          }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.1}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#f0f0f0" 
            vertical={false}
          />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 10 }}
            stroke="#9CA3AF"
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
            interval="preserveStartEnd"
            minTickGap={25}
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fontSize: 10 }}
            stroke="#9CA3AF"
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
            tickFormatter={(value) => {
              if (isDigital) {
                return value === 1 ? 'ON' : value === 0 ? 'OFF' : '';
              }
              return value.toFixed(1);
            }}
            width={40}
          />
          <Tooltip 
            content={<CustomTooltip isDigital={isDigital} unit={unit} />}
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            name={name}
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ 
              r: 4, 
              stroke: 'white', 
              strokeWidth: 2,
              fill: color
            }}
            isAnimationActive={true}
            animationDuration={1000}
            animationEasing="ease-in-out"
            fill="url(#colorValue)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(PinHistoryChart);

// Factory function that creates a new chart instance
export const createPinHistoryChart = (
  historyData: ChartDataPoint[],
  dataKey: string = 'value',
  isDigital: boolean = false,
  color: string = '#3b82f6',
  unit: string = '',
  name: string = 'Sensor Value'
) => (
  <PinHistoryChart 
    historyData={historyData} 
    dataKey={dataKey} 
    isDigital={isDigital} 
    color={color}
    unit={unit}
    name={name}
  />
);
