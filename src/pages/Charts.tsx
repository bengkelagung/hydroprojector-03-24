
import React, { useState, useEffect } from 'react';
import { useHydro } from '@/contexts/HydroContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PinHistoryChart from '@/components/PinHistoryChart';
import { fetchPinHistory, formatPinHistoryForRecharts } from '@/utils/pin-history';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, PauseCircle, PlayCircle, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useSessionRefresh } from '@/hooks/use-session-refresh';

const Charts = () => {
  const { pins, devices, projects } = useHydro();
  const { toast } = useToast();
  const { withSessionRefresh } = useSessionRefresh();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [historyTimeRange, setHistoryTimeRange] = useState<'hour' | 'day' | 'week' | 'month'>('day');
  const [pinHistoryData, setPinHistoryData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  
  const getSignalColor = (signalType: string) => {
    switch (signalType) {
      case 'pH': return '#9333ea'; // purple-600
      case 'temperature': return '#ea580c'; // orange-600
      case 'humidity': return '#2563eb'; // blue-600
      case 'water-level': return '#06b6d4'; // cyan-500
      case 'nutrient': return '#16a34a'; // green-600
      case 'light': return '#ca8a04'; // yellow-600
      default: return '#6b7280'; // gray-500
    }
  };
  
  const fetchAllPinHistory = async () => {
    if (pins.length === 0) return;
    
    setLoading(true);
    const newHistoryData: Record<string, any[]> = {};
    
    try {
      await Promise.all(pins.map(async (pin) => {
        try {
          const history = await withSessionRefresh(() => fetchPinHistory(pin.id, historyTimeRange));
          if (history) {
            const isDigital = pin.dataType === 'digital' || pin.dataType === 'boolean';
            newHistoryData[pin.id] = formatPinHistoryForRecharts(history, isDigital, pin.name);
          }
        } catch (error) {
          console.error(`Error fetching history for pin ${pin.name}:`, error);
        }
      }));
      
      setPinHistoryData(newHistoryData);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error fetching pin history:', error);
      toast({
        title: "Error",
        description: "Failed to load chart data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAllPinHistory();
  }, [pins, historyTimeRange]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchAllPinHistory();
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, historyTimeRange]);
  
  const filterPinsByTab = (tabValue: string) => {
    if (tabValue === 'all') return pins;
    if (tabValue === 'input') return pins.filter(p => p.mode === 'input');
    if (tabValue === 'output') return pins.filter(p => p.mode === 'output');
    
    // Filter by device
    return pins.filter(p => p.deviceId === tabValue);
  };
  
  const getDeviceById = (deviceId: string) => {
    return devices.find(d => d.id === deviceId);
  };
  
  const getProjectById = (projectId: string) => {
    return projects.find(p => p.id === projectId);
  };
  
  const handleRefresh = () => {
    fetchAllPinHistory();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Grafik</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? (
              <>
                <PauseCircle className="h-4 w-4 mr-1" />
                Pause Auto-refresh
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-1" />
                Enable Auto-refresh
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Select 
            value={historyTimeRange} 
            onValueChange={(value) => setHistoryTimeRange(value as 'hour' | 'day' | 'week' | 'month')}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Last Hour</SelectItem>
              <SelectItem value="day">Last Day</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Chart View
            <span className="text-xs font-normal text-gray-500 ml-2">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 flex w-full overflow-auto">
              <TabsTrigger value="all">All Pins</TabsTrigger>
              <TabsTrigger value="input">Input Pins</TabsTrigger>
              <TabsTrigger value="output">Output Pins</TabsTrigger>
              {devices.map(device => (
                <TabsTrigger key={device.id} value={device.id}>{device.name}</TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value={activeTab} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filterPinsByTab(activeTab).map(pin => {
                  const device = getDeviceById(pin.deviceId);
                  const project = device ? getProjectById(device.projectId) : null;
                  
                  return (
                    <Card key={pin.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getSignalColor(pin.signalType) }}
                            ></div>
                            {pin.name}
                            <span className="ml-1 text-xs text-gray-500">
                              ({pin.mode === 'input' ? 'Sensor' : 'Control'})
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {device?.name} / {project?.name}
                          </div>
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="p-2">
                        {loading ? (
                          <div className="h-40 flex items-center justify-center">
                            <Skeleton className="h-40 w-full" />
                          </div>
                        ) : pinHistoryData[pin.id] && pinHistoryData[pin.id].length > 0 ? (
                          <PinHistoryChart 
                            historyData={pinHistoryData[pin.id]} 
                            dataKey={pin.name} 
                            isDigital={pin.dataType === 'digital' || pin.dataType === 'boolean'}
                            color={getSignalColor(pin.signalType)} 
                          />
                        ) : (
                          <div className="h-40 flex items-center justify-center bg-gray-50 rounded-lg">
                            <p className="text-gray-500">No data available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {filterPinsByTab(activeTab).length === 0 && (
                <div className="text-center py-10">
                  <p className="text-gray-500">No pins available for this selection</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Charts;
