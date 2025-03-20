
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHydro, Pin } from '@/contexts/HydroContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import PinHistoryChart from '@/components/PinHistoryChart';

export default function Charts() {
  const { pins, devices, projects } = useHydro();
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('24');
  const [chartData, setChartData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Filter pins based on selections
  const filteredPins = pins.filter(pin => {
    if (selectedDevice !== 'all' && pin.deviceId !== selectedDevice) return false;
    
    if (selectedProject !== 'all') {
      const device = devices.find(d => d.id === pin.deviceId);
      if (!device || device.projectId !== selectedProject) return false;
    }
    
    return true;
  });

  const inputPins = filteredPins.filter(p => p.mode === 'input');
  const outputPins = filteredPins.filter(p => p.mode === 'output');

  // Fetch pin history data
  const fetchPinHistoryData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const timeRange = parseInt(selectedTimeRange);
      const timeAgo = new Date();
      timeAgo.setHours(timeAgo.getHours() - timeRange);
      
      const newChartData: Record<string, any[]> = {};
      
      for (const pin of filteredPins) {
        // Fetch data directly from the pin_data table
        const { data, error } = await supabase
          .from('pin_data')
          .select('value, created_at') // Using created_at instead of timestamp
          .eq('pin_config_id', pin.id)
          .gte('created_at', timeAgo.toISOString())
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error(`Error fetching data for pin ${pin.id}:`, error);
          throw error;
        }
        
        // Format the data for the chart
        if (data && data.length > 0) {
          newChartData[pin.id] = data.map(item => ({
            timestamp: new Date(item.created_at),
            value: parseFloat(item.value) || 0
          }));
        } else {
          // If no data, create some sample data for demonstration
          const demoData = generateDemoData(pin, timeRange);
          newChartData[pin.id] = demoData;
        }
      }
      
      setChartData(newChartData);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError('Failed to load chart data. Please try again later.');
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  // Generate demo data for pins that don't have real data
  const generateDemoData = (pin: Pin, hours: number) => {
    const data = [];
    const now = new Date();
    const points = Math.min(hours * 2, 100); // 2 points per hour, max 100 points
    
    for (let i = 0; i < points; i++) {
      const time = new Date(now.getTime() - ((points - i) * (hours * 3600000 / points)));
      
      let value;
      if (pin.label?.toLowerCase()?.includes('ph')) {
        value = 6 + Math.random() * 1.5; // pH values between 6 and 7.5
      } else if (pin.label?.toLowerCase()?.includes('temp') || pin.signalType === 'temperature') {
        value = 22 + Math.random() * 6; // Temp between 22-28C
      } else if (pin.label?.toLowerCase()?.includes('humid') || pin.signalType === 'humidity') {
        value = 60 + Math.random() * 20; // Humidity between 60-80%
      } else if (pin.mode === 'output') {
        value = Math.random() > 0.5 ? 1 : 0; // Binary on/off for outputs
      } else {
        value = 40 + Math.random() * 60; // Generic value between 40-100
      }
      
      data.push({
        timestamp: time,
        value: parseFloat(value.toFixed(2))
      });
    }
    
    return data;
  };

  // Fetch data when selections change
  useEffect(() => {
    fetchPinHistoryData();
    
    // Set up auto-refresh interval
    const intervalId = setInterval(() => {
      fetchPinHistoryData();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(intervalId);
  }, [selectedProject, selectedDevice, selectedTimeRange]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-bold text-gray-800">Sensor Data Charts</h2>
        
        <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchPinHistoryData}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          
          <Select 
            value={selectedTimeRange} 
            onValueChange={setSelectedTimeRange}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last Hour</SelectItem>
              <SelectItem value="6">Last 6 Hours</SelectItem>
              <SelectItem value="12">Last 12 Hours</SelectItem>
              <SelectItem value="24">Last 24 Hours</SelectItem>
              <SelectItem value="48">Last 2 Days</SelectItem>
              <SelectItem value="168">Last Week</SelectItem>
            </SelectContent>
          </Select>
          
          {projects.length > 0 && (
            <Select 
              value={selectedProject} 
              onValueChange={setSelectedProject}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {devices.length > 0 && (
            <Select 
              value={selectedDevice} 
              onValueChange={setSelectedDevice}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by Device" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                {devices
                  .filter(device => selectedProject === 'all' || device.projectId === selectedProject)
                  .map(device => (
                    <SelectItem key={device.id} value={device.id}>{device.name}</SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="text-xs text-gray-500 mb-4">
        Last updated: {lastRefresh.toLocaleTimeString()} • Auto-refreshes every minute
      </div>
      
      <Tabs defaultValue="input">
        <TabsList className="mb-6">
          <TabsTrigger value="input">Input Sensors</TabsTrigger>
          <TabsTrigger value="output">Output Controls</TabsTrigger>
        </TabsList>
        
        <TabsContent value="input" className="space-y-6">
          {inputPins.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-2">No input sensors found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Configure input pins on your devices to see their data charts here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {inputPins.map(pin => {
                const device = devices.find(d => d.id === pin.deviceId);
                const project = device ? projects.find(p => p.id === device.projectId) : null;
                
                return (
                  <Card key={pin.id} className="overflow-hidden">
                    <CardHeader className="bg-gray-50 pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{pin.name}</CardTitle>
                          <p className="text-sm text-gray-500">
                            {pin.label || pin.signalType} • {device?.name || 'Unknown Device'} • {project?.name || 'Unknown Project'}
                          </p>
                        </div>
                        <div className="text-sm text-gray-700 font-medium">
                          {pin.value ? `${pin.value}${pin.unit || ''}` : 'No data'}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 h-[300px]">
                      {chartData[pin.id] ? (
                        <PinHistoryChart 
                          data={chartData[pin.id]} 
                          yAxisLabel={pin.unit || ''} 
                          isLoading={loading}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          No data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="output" className="space-y-6">
          {outputPins.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-2">No output controls found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Configure output pins on your devices to see their activity charts here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {outputPins.map(pin => {
                const device = devices.find(d => d.id === pin.deviceId);
                const project = device ? projects.find(p => p.id === device.projectId) : null;
                
                return (
                  <Card key={pin.id} className="overflow-hidden">
                    <CardHeader className="bg-gray-50 pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{pin.name}</CardTitle>
                          <p className="text-sm text-gray-500">
                            {pin.label || pin.signalType} • {device?.name || 'Unknown Device'} • {project?.name || 'Unknown Project'}
                          </p>
                        </div>
                        <div className="text-sm text-gray-700 font-medium">
                          {pin.value === '1' ? 'ON' : 'OFF'}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 h-[300px]">
                      {chartData[pin.id] ? (
                        <PinHistoryChart 
                          data={chartData[pin.id]} 
                          yAxisLabel="State" 
                          isLoading={loading}
                          isBinary={true}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          No data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
