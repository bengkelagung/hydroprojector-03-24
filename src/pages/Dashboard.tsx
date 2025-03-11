import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Leaf, Droplet, Activity, ThermometerIcon, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useHydro } from '@/contexts/HydroContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

const Dashboard = () => {
  const { user } = useAuth();
  const { projects, devices, pins, getDevicesByProject, getPinsByDevice } = useHydro();

  // Mock some data if no real data exists for better demonstration
  useEffect(() => {
    // This will only be used for visualization if there's no real data
    const mockDataUpdate = () => {
      if (pins.length > 0) {
        pins.forEach(pin => {
          // Simulate random value changes for input pins
          if (pin.mode === 'input') {
            let value;
            switch (pin.signalType) {
              case 'pH':
                value = (5.5 + Math.random() * 2).toFixed(1);
                break;
              case 'temperature':
                value = (20 + Math.random() * 8).toFixed(1);
                break;
              case 'humidity':
                value = (50 + Math.random() * 30).toFixed(1);
                break;
              case 'water-level':
                value = (70 + Math.random() * 30).toFixed(1);
                break;
              default:
                value = Math.floor(Math.random() * 100).toString();
            }
            
            // This would normally update the pin value in state or backend
            // For this demo, we're just showing how it would work
            console.log(`Updated ${pin.name} (${pin.signalType}) to ${value}`);
          }
        });
      }
    };

    const interval = setInterval(mockDataUpdate, 5000);
    return () => clearInterval(interval);
  }, [pins]);

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

  // Get a status icon based on device connection
  const getStatusIcon = (isConnected: boolean) => {
    return isConnected ? (
      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 flex items-center">
        <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></div>
        Connected
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 flex items-center">
        <div className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></div>
        Offline
      </Badge>
    );
  };

  // Render a placeholder if no projects exist
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <div className="mb-8 p-4 bg-blue-50 rounded-full">
          <Leaf className="h-16 w-16 text-hydro-blue" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No projects yet</h2>
        <p className="text-gray-600 mb-8 text-center max-w-md">
          Create your first hydroponics project to start monitoring and controlling your ESP32 devices.
        </p>
        <Link to="/projects/create">
          <Button className="bg-hydro-blue hover:bg-blue-700">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create Your First Project
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-bold text-gray-800">Hello, {user?.name}</h2>
        <div className="mt-4 sm:mt-0 space-x-3">
          <Link to="/projects/create">
            <Button variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
          <Link to="/devices/create">
            <Button className="bg-hydro-blue hover:bg-blue-700">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Device
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="projects">
        <TabsList className="mb-4">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="readings">Sensor Readings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const projectDevices = getDevicesByProject(project.id);
              const deviceCount = projectDevices.length;
              const connectedCount = projectDevices.filter(d => d.isConnected).length;
              
              return (
                <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-hydro-blue to-hydro-water pb-6">
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary" className="bg-white/80 text-hydro-blue">
                        {deviceCount} {deviceCount === 1 ? 'Device' : 'Devices'}
                      </Badge>
                    </div>
                    <CardTitle className="text-white">{project.name}</CardTitle>
                    <CardDescription className="text-blue-100">
                      Created on {new Date(project.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-gray-600 mb-4">{project.description}</p>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Connected Devices</span>
                          <span className="font-medium">{connectedCount}/{deviceCount}</span>
                        </div>
                        <Progress value={(connectedCount / Math.max(deviceCount, 1)) * 100} />
                      </div>
                      
                      {deviceCount === 0 && (
                        <div className="text-sm text-gray-500 italic">
                          No devices added to this project yet
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex justify-between">
                    <Link to="/devices/create">
                      <Button variant="outline" size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Device
                      </Button>
                    </Link>
                    <Link to={`/projects/${project.id}/details`}>
                      <Button variant="ghost" size="sm">View Details</Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="devices" className="space-y-6">
          {devices.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
              <div className="mb-4 inline-flex p-3 bg-gray-100 rounded-full">
                <Droplet className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No devices yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Add your first ESP32 device to start monitoring your hydroponics system.
              </p>
              <Link to="/devices/create">
                <Button className="bg-hydro-blue hover:bg-blue-700">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Your First Device
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {devices.map((device) => {
                const devicePins = getPinsByDevice(device.id);
                const project = projects.find(p => p.id === device.projectId);
                
                return (
                  <Card key={device.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{device.name}</CardTitle>
                          <CardDescription>Project: {project?.name || 'Unknown'}</CardDescription>
                        </div>
                        {getStatusIcon(device.isConnected)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">{device.description}</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Configured Pins</h4>
                        {devicePins.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">No pins configured yet</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {devicePins.slice(0, 4).map(pin => (
                              <div key={pin.id} className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${getSignalColor(pin.signalType)}`}></div>
                                <span className="text-sm">{pin.name}</span>
                              </div>
                            ))}
                            {devicePins.length > 4 && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">+{devicePins.length - 4} more</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        Last seen: {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4 flex justify-between">
                      <Link to={`/devices/${device.id}/config`}>
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                      </Link>
                      <Link to={`/devices/${device.id}/code`}>
                        <Button size="sm" className="bg-hydro-blue hover:bg-blue-700">
                          View Code
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="readings" className="space-y-6">
          {pins.filter(p => p.mode === 'input').length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
              <div className="mb-4 inline-flex p-3 bg-gray-100 rounded-full">
                <Activity className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No sensor data yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Configure your device pins to start collecting sensor data.
              </p>
              {devices.length > 0 ? (
                <Link to={`/devices/${devices[0].id}/config`}>
                  <Button className="bg-hydro-blue hover:bg-blue-700">
                    Configure Device Pins
                  </Button>
                </Link>
              ) : (
                <Link to="/devices/create">
                  <Button className="bg-hydro-blue hover:bg-blue-700">
                    Add Your First Device
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Display each input pin as a separate card */}
              {pins.filter(p => p.mode === 'input').map(pin => {
                const device = devices.find(d => d.id === pin.deviceId);
                const project = device ? projects.find(p => p.id === device.projectId) : null;
                
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
                
                // Determine alert status (just for UI demonstration)
                let alert = false;
                if (pin.signalType === 'pH' && (parseFloat(value) < 5.5 || parseFloat(value) > 7.5)) {
                  alert = true;
                } else if (pin.signalType === 'temperature' && (parseFloat(value) < 18 || parseFloat(value) > 28)) {
                  alert = true;
                } else if (pin.signalType === 'water-level' && parseFloat(value) < 40) {
                  alert = true;
                }
                
                return (
                  <Card key={pin.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className={`bg-opacity-10 ${getSignalColor(pin.signalType).replace('bg-', 'bg-opacity-10 bg-')}`}>
                      <div className="flex items-center">
                        {pin.signalType === 'pH' && <Droplet className="h-5 w-5 mr-2 text-purple-500" />}
                        {pin.signalType === 'temperature' && <ThermometerIcon className="h-5 w-5 mr-2 text-orange-500" />}
                        {pin.signalType === 'water-level' && <Droplet className="h-5 w-5 mr-2 text-cyan-500" />}
                        {pin.signalType === 'humidity' && <Droplet className="h-5 w-5 mr-2 text-blue-500" />}
                        {(pin.signalType === 'custom' || pin.signalType === 'nutrient' || pin.signalType === 'light') && (
                          <Activity className="h-5 w-5 mr-2 text-gray-500" />
                        )}
                        <CardTitle className="capitalize">{pin.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="pb-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-gray-800">{pin.signalType} Sensor</h4>
                              <p className="text-xs text-gray-500">
                                {device?.name} • {project?.name}
                              </p>
                            </div>
                            <div className="flex items-center">
                              {alert && (
                                <AlertTriangle className="h-4 w-4 text-amber-500 mr-1.5" />
                              )}
                              <span className={`text-lg font-semibold ${alert ? 'text-amber-500' : 'text-gray-800'}`}>
                                {value}{pin.unit}
                              </span>
                            </div>
                          </div>
                          
                          {/* Visual indicator appropriate to the type of sensor */}
                          {pin.signalType === 'pH' && (
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${parseFloat(value) < 6 ? 'bg-red-500' : parseFloat(value) > 7 ? 'bg-purple-500' : 'bg-green-500'}`} 
                                style={{ width: `${(parseFloat(value) / 14) * 100}%` }}
                              ></div>
                            </div>
                          )}
                          {(pin.signalType === 'water-level' || pin.signalType === 'humidity' || pin.signalType === 'nutrient') && (
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${parseFloat(value) < 30 ? 'bg-red-500' : parseFloat(value) < 60 ? 'bg-amber-500' : 'bg-green-500'}`} 
                                style={{ width: `${parseFloat(value)}%` }}
                              ></div>
                            </div>
                          )}
                          {pin.signalType === 'temperature' && (
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${parseFloat(value) < 18 ? 'bg-blue-500' : parseFloat(value) > 28 ? 'bg-red-500' : 'bg-green-500'}`} 
                                style={{ width: `${(parseFloat(value) / 40) * 100}%` }}
                              ></div>
                            </div>
                          )}
                          <div className="mt-2">
                            <Link to={`/devices/${device?.id}/details`} className="text-sm text-blue-600 hover:text-blue-800">
                              View Details
                            </Link>
                          </div>
                        </div>
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

export default Dashboard;
