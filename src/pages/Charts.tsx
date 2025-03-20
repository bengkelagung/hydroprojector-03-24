import React, { useState, useEffect, useCallback } from 'react';
import { useHydro, Pin } from '@/contexts/HydroContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PinHistoryChart from '@/components/PinHistoryChart';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartDataPoint } from '@/utils/pin-history';
import { RefreshCw, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getPinHistoryData } from '@/integrations/supabase/client';

const Charts = () => {
  const { pins, devices, projects } = useHydro();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('all');
  const [selectedPinMode, setSelectedPinMode] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  
  const filteredPins = pins.filter(pin => {
    if (selectedPinMode !== 'all' && pin.mode !== selectedPinMode) return false;
    if (selectedDeviceId !== 'all' && pin.deviceId !== selectedDeviceId) return false;
    if (selectedProjectId !== 'all') {
      const device = devices.find(d => d.id === pin.deviceId);
      if (!device || device.projectId !== selectedProjectId) return false;
    }
    return true;
  });

  const projectOptions = [
    { id: 'all', name: 'All Projects' },
    ...projects
  ];
  
  const deviceOptions = selectedProjectId === 'all'
    ? [{ id: 'all', name: 'All Devices' }, ...devices]
    : [
        { id: 'all', name: 'All Devices' },
        ...devices.filter(d => d.projectId === selectedProjectId)
      ];

  useEffect(() => {
    setSelectedDeviceId('all');
  }, [selectedProjectId]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        console.log('Auto-refreshing charts data');
        refetch();
      }, 60000); // Refresh every minute
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getTimeRangeHours = (): number => {
    switch (timeRange) {
      case '1h': return 1;
      case '6h': return 6;
      case '12h': return 12;
      case '24h': return 24;
      case '7d': return 24 * 7;
      case '30d': return 24 * 30;
      default: return 24;
    }
  };

  const fetchChartData = useCallback(async () => {
    const hours = getTimeRangeHours();
    const results: Record<string, ChartDataPoint[]> = {};
    
    const batchSize = 5;
    for (let i = 0; i < filteredPins.length; i += batchSize) {
      const batch = filteredPins.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (pin) => {
        try {
          const history = await getPinHistoryData(pin.id, hours);
          if (history && history.length > 0) {
            results[pin.id] = history.map(item => ({
              time: new Date(item.created_at).toLocaleTimeString(),
              value: parseFloat(item.value || '0'),
              timestamp: new Date(item.created_at).getTime()
            }));
          } else {
            results[pin.id] = [];
          }
        } catch (error) {
          console.error(`Error fetching history for pin ${pin.id}:`, error);
          results[pin.id] = [];
        }
      }));
      
      if (i + batchSize < filteredPins.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    return results;
  }, [filteredPins, getTimeRangeHours]);

  const { data: chartsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['pinCharts', filteredPins.map(p => p.id), timeRange],
    queryFn: fetchChartData,
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minute
    retry: 1, // Reduce retries to prevent multiple heavy requests
  });

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Pin Charts</h1>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {autoRefresh ? "Auto Refresh: On" : "Auto Refresh: Off"}
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filter Charts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-filter">Project</Label>
              <Select 
                value={selectedProjectId} 
                onValueChange={setSelectedProjectId}
              >
                <SelectTrigger id="project-filter">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {projectOptions.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="device-filter">Device</Label>
              <Select 
                value={selectedDeviceId} 
                onValueChange={setSelectedDeviceId}
              >
                <SelectTrigger id="device-filter">
                  <SelectValue placeholder="Select Device" />
                </SelectTrigger>
                <SelectContent>
                  {deviceOptions.map(device => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mode-filter">Pin Mode</Label>
              <Select 
                value={selectedPinMode} 
                onValueChange={setSelectedPinMode}
              >
                <SelectTrigger id="mode-filter">
                  <SelectValue placeholder="Select Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="input">Input Only</SelectItem>
                  <SelectItem value="output">Output Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time-range">Time Range</Label>
              <Select 
                value={timeRange} 
                onValueChange={setTimeRange}
              >
                <SelectTrigger id="time-range">
                  <SelectValue placeholder="Select Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="6h">Last 6 Hours</SelectItem>
                  <SelectItem value="12h">Last 12 Hours</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <p className="text-muted-foreground">Loading charts data...</p>
            </div>
          ) : filteredPins.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-2">No pins found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Adjust your filters to see pin charts or configure pins for your devices.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPins.map(pin => {
                const device = devices.find(d => d.id === pin.deviceId);
                const project = device ? projects.find(p => p.id === device.projectId) : null;
                const pinData = chartsData?.[pin.id] || [];
                const isDigital = pin.dataType === 'digital' || pin.signalType === 'digital';
                
                return (
                  <Card key={pin.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex justify-between">
                        <span>{pin.name}</span>
                        <span className="text-sm font-normal text-muted-foreground capitalize">
                          {pin.mode}
                        </span>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {device?.name} • {project?.name}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px] w-full">
                        {pinData.length > 0 ? (
                          <PinHistoryChart 
                            historyData={pinData} 
                            dataKey="value" 
                            isDigital={isDigital}
                            color={pin.mode === 'input' ? '#3b82f6' : '#10b981'}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-500">No history data available</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="list" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <p className="text-muted-foreground">Loading charts data...</p>
            </div>
          ) : filteredPins.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-2">No pins found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Adjust your filters to see pin charts or configure pins for your devices.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPins.map(pin => {
                const device = devices.find(d => d.id === pin.deviceId);
                const project = device ? projects.find(p => p.id === device.projectId) : null;
                const pinData = chartsData?.[pin.id] || [];
                const isDigital = pin.dataType === 'digital' || pin.signalType === 'digital';
                
                return (
                  <Card key={pin.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex justify-between">
                        <span>{pin.name}</span>
                        <span className="text-sm font-normal text-muted-foreground capitalize">
                          {pin.mode}
                        </span>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {device?.name} • {project?.name}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] w-full">
                        {pinData.length > 0 ? (
                          <PinHistoryChart 
                            historyData={pinData} 
                            dataKey="value" 
                            isDigital={isDigital}
                            color={pin.mode === 'input' ? '#3b82f6' : '#10b981'}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-500">No history data available</p>
                          </div>
                        )}
                      </div>
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
};

export default Charts;
