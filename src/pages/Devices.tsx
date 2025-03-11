
import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHydro } from '@/contexts/HydroContext';

const Devices = () => {
  const { devices, projects, getPinsByDevice } = useHydro();

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-bold text-gray-800">Devices</h2>
        <div className="mt-4 sm:mt-0">
          <Link to="/devices/create">
            <Button className="bg-hydro-blue hover:bg-blue-700">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Device
            </Button>
          </Link>
        </div>
      </div>

      {devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">No devices yet</p>
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
                  <div className="flex space-x-2">
                    <Link to={`/devices/${device.id}/config`}>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </Link>
                    <Link to={`/devices/${device.id}/code`}>
                      <Button variant="outline" size="sm">
                        Code
                      </Button>
                    </Link>
                  </div>
                  <Link to={`/devices/${device.id}/details`}>
                    <Button size="sm" className="bg-hydro-blue hover:bg-blue-700">
                      View Details
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Devices;
