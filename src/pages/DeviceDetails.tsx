
import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Cpu, Settings, Code, Activity, Pencil } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHydro } from '@/contexts/HydroContext';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DeviceDetails = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { devices, projects, pins, getPinsByDevice } = useHydro();
  
  const device = devices.find(d => d.id === deviceId);
  
  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-600 mb-4">Device not found</p>
        <Button onClick={() => navigate('/devices')} variant="outline">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Devices
        </Button>
      </div>
    );
  }

  const project = projects.find(p => p.id === device.projectId);
  const devicePins = getPinsByDevice(device.id);
  const inputPins = devicePins.filter(p => p.mode === 'input');
  const outputPins = devicePins.filter(p => p.mode === 'output');
  
  // Helper function to get a color based on signal type
  const getSignalColor = (signalType: string) => {
    switch (signalType) {
      case 'pH': return 'bg-purple-500';
      case 'temperature': return 'bg-orange-500';
      case 'humidity': return 'bg-blue-500';
      case 'water-level': return 'bg-cyan-500';
      case 'nutrient': return 'bg-green-500';
      case 'light': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-2">
        <Button onClick={() => navigate('/devices')} variant="ghost" size="sm">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h2 className="text-3xl font-bold text-gray-800">{device.name}</h2>
        <Badge variant="outline" className={
          device.isConnected 
            ? "bg-green-50 text-green-600 border-green-200 ml-auto" 
            : "bg-red-50 text-red-600 border-red-200 ml-auto"
        }>
          {device.isConnected ? 'Connected' : 'Offline'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Device Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="text-gray-800 mt-1">{device.description}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Project</h3>
                  <p className="text-gray-800 mt-1">
                    {project ? (
                      <Link to={`/projects/${project.id}/details`} className="text-hydro-blue hover:underline">
                        {project.name}
                      </Link>
                    ) : 'Not assigned to a project'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Seen</h3>
                  <p className="text-gray-800 mt-1">
                    {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button variant="outline" className="w-full sm:w-auto">
                <Pencil className="mr-2 h-4 w-4" />
                Edit Device
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Device Pins</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="input">
                <TabsList className="mb-4">
                  <TabsTrigger value="input">Input Pins ({inputPins.length})</TabsTrigger>
                  <TabsTrigger value="output">Output Pins ({outputPins.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="input">
                  {inputPins.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No input pins configured</p>
                      <Link to={`/devices/${device.id}/config`} className="mt-4 inline-block">
                        <Button size="sm" variant="outline">Configure Pins</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {inputPins.map(pin => {
                        // Generate mock value for demo purposes if none exists
                        let mockValue;
                        switch (pin.signalType) {
                          case 'pH':
                            mockValue = (5.5 + Math.random() * 2).toFixed(1);
                            break;
                          case 'temperature':
                            mockValue = (20 + Math.random() * 8).toFixed(1);
                            break;
                          case 'humidity':
                            mockValue = (50 + Math.random() * 30).toFixed(1);
                            break;
                          case 'water-level':
                            mockValue = (70 + Math.random() * 30).toFixed(1);
                            break;
                          default:
                            mockValue = Math.floor(Math.random() * 100).toString();
                        }
                        
                        const value = pin.value || mockValue;
                        
                        return (
                          <div key={pin.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full ${getSignalColor(pin.signalType)}`}></div>
                              <div className="ml-3">
                                <h4 className="font-medium text-gray-800">{pin.name}</h4>
                                <p className="text-xs text-gray-500 capitalize">{pin.signalType} Sensor (Pin {pin.pinNumber})</p>
                              </div>
                            </div>
                            <div className="font-semibold text-gray-800">
                              {value}{pin.unit}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="output">
                  {outputPins.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No output pins configured</p>
                      <Link to={`/devices/${device.id}/config`} className="mt-4 inline-block">
                        <Button size="sm" variant="outline">Configure Pins</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {outputPins.map(pin => (
                        <div key={pin.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full ${getSignalColor(pin.signalType)}`}></div>
                            <div className="ml-3">
                              <h4 className="font-medium text-gray-800">{pin.name}</h4>
                              <p className="text-xs text-gray-500 capitalize">{pin.signalType} Control (Pin {pin.pinNumber})</p>
                            </div>
                          </div>
                          <div>
                            <Badge variant={pin.value === "1" ? "default" : "outline"}>
                              {pin.value === "1" ? "ON" : "OFF"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p className={`text-lg font-bold mt-1 ${device.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {device.isConnected ? 'Connected' : 'Offline'}
                  </p>
                </div>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Configured Pins</h3>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{devicePins.length}</p>
                </div>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Device ID</h3>
                  <p className="text-sm font-mono bg-gray-100 p-2 mt-1 rounded">{device.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to={`/devices/${device.id}/config`}>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure Pins
                </Button>
              </Link>
              <Link to={`/devices/${device.id}/code`}>
                <Button variant="outline" className="w-full justify-start">
                  <Code className="mr-2 h-4 w-4" />
                  View Code
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DeviceDetails;
