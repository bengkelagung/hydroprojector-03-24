import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useHydro, Pin } from '@/contexts/HydroContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PinHistoryChart from '@/components/PinHistoryChart';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartDataPoint } from '@/utils/pin-history';
import { RefreshCw, Filter } from 'lucide-react';
import { getPinHistoryData } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Charts = () => {
  const { pins, devices, projects } = useHydro();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('all');
  const [selectedPinMode, setSelectedPinMode] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('1h');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chartsData, setChartsData] = useState<Record<string, ChartDataPoint[]>>({});
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const filteredPins = useMemo(() => {
    return pins.filter(pin => {
      if (selectedPinMode !== 'all' && pin.mode !== selectedPinMode) return false;
      if (selectedDeviceId !== 'all' && pin.deviceId !== selectedDeviceId) return false;
      if (selectedProjectId !== 'all') {
        const device = devices.find(d => d.id === pin.deviceId);
        if (!device || device.projectId !== selectedProjectId) return false;
      }
      return true;
    }).slice(0, 4);
  }, [pins, selectedProjectId, selectedDeviceId, selectedPinMode, devices]);

  const projectOptions = useMemo(() => [
    { id: 'all', name: 'All Projects' },
    ...projects
  ], [projects]);
  
  const deviceOptions = useMemo(() => selectedProjectId === 'all'
    ? [{ id: 'all', name: 'All Devices' }, ...devices]
    : [
        { id: 'all', name: 'All Devices' },
        ...devices.filter(d => d.projectId === selectedProjectId)
      ],
  [selectedProjectId, devices]);

  useEffect(() => {
    setSelectedDeviceId('all');
  }, [selectedProjectId]);

  useEffect(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    
    if (autoRefresh) {
      refreshTimeoutRef.current = setTimeout(() => {
        fetchChartData();
      }, 120000);
    }
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [autoRefresh, filteredPins, timeRange]);

  useEffect(() => {
    if (filteredPins.length <= 4) {
      fetchChartData();
    } else {
      setChartsData({});
      setIsLoading(false);
      toast.info(`${filteredPins.length} pins found. Click Refresh to load data.`);
    }
  }, [filteredPins, timeRange]);

  const getTimeRangeHours = useCallback((): number => {
    switch (timeRange) {
      case '1h': return 1;
      case '6h': return 6;
      case '12h': return 12;
      case '24h': return 24;
      case '7d': return 24 * 7;
      case '30d': return 24 * 30;
      default: return 1;
    }
  }, [timeRange]);

  const fetchChartData = useCallback(async () => {
    if (isLoading && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    if (filteredPins.length === 0) {
      setChartsData({});
      return;
    }
    
    setIsLoading(true);
    
    try {
      const hours = getTimeRangeHours();
      const results: Record<string, ChartDataPoint[]> = {};
      
      const batchSize = 1;
      
      for (let i = 0; i < filteredPins.length; i += batchSize) {
        if (abortControllerRef.current?.signal.aborted) {
          console.log('Chart data fetching aborted');
          return;
        }
        
        const batch = filteredPins.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (pin) => {
          try {
            if (abortControllerRef.current?.signal.aborted) {
              return;
            }
            
            const history = await getPinHistoryData(pin.id, hours);
            
            if (history && history.length > 0) {
              const maxPoints = 10;
              let processedData;
              
              if (history.length > maxPoints) {
                const interval = Math.floor(history.length / maxPoints);
                const sampledData = [history[0]];
                
                for (let j = interval; j < history.length - interval; j += interval) {
                  sampledData.push(history[j]);
                }
                
                if (history.length > 1) {
                  sampledData.push(history[history.length - 1]);
                }
                
                processedData = sampledData;
              } else {
                processedData = history;
              }
              
              results[pin.id] = processedData.map(item => ({
                time: new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
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
        
        if (i + batchSize < filteredPins.length && !abortControllerRef.current?.signal.aborted) {
          setChartsData(prev => ({...prev, ...results}));
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (!abortControllerRef.current?.signal.aborted) {
        setChartsData(results);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      toast.error('Error loading chart data');
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [filteredPins, getTimeRangeHours]);

  const handleRefresh = useCallback(() => {
    fetchChartData();
  }, [fetchChartData]);

  const renderGridView = useCallback(() => {
    if (isLoading && Object.keys(chartsData).length === 0) {
      return (
        <div className="flex justify-center items-center h-40">
          <p className="text-muted-foreground">Loading charts data...</p>
        </div>
      );
    }
    
    if (filteredPins.length === 0) {
      return (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-2">No pins found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Adjust your filters to see pin charts or configure pins for your devices.
          </p>
        </div>
      );
    }
    
    return (
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
    );
  }, [filteredPins, chartsData, isLoading, devices, projects]);

  const renderListView = useCallback(() => {
    if (isLoading && Object.keys(chartsData).length === 0) {
      return (
        <div className="flex justify-center items-center h-40">
          <p className="text-muted-foreground">Loading charts data...</p>
        </div>
      );
    }
    
    if (filteredPins.length === 0) {
      return (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-2">No pins found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Adjust your filters to see pin charts or configure pins for your devices.
          </p>
        </div>
      );
    }
    
    return (
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
    );
  }, [filteredPins, chartsData, isLoading, devices, projects]);

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
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
          
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "bg-green-600 hover:bg-green-700" : ""}
            disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
          {renderGridView()}
        </TabsContent>
        
        <TabsContent value="list" className="space-y-6">
          {renderListView()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Charts;
