
import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Droplet, ThermometerIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useHydro } from '@/contexts/HydroContext';

const Readings = () => {
  const { pins, devices, projects } = useHydro();
  
  // Get only input pins 
  const inputPins = pins.filter(p => p.mode === 'input');
  
  // Get device name by deviceId
  const getDeviceName = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    return device ? device.name : 'Unknown Device';
  };
  
  // Get project name by deviceId
  const getProjectName = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return 'Unknown Project';
    
    const project = projects.find(p => p.id === device.projectId);
    return project ? project.name : 'Unknown Project';
  };
  
  // Get icon based on signal type
  const getSignalIcon = (signalType: string) => {
    switch (signalType) {
      case 'temperature':
        return <ThermometerIcon className="h-5 w-5 text-orange-500" />;
      case 'humidity':
      case 'water-level':
      case 'pH':
        return <Droplet className="h-5 w-5 text-blue-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Sensor Readings</h2>
      </div>

      {inputPins.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">No sensors configured yet</p>
          <p className="text-sm text-gray-500">
            Add sensors to your devices to see readings here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inputPins.map((pin) => {
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
              <Card key={pin.id} className="overflow-hidden">
                <CardHeader className="bg-hydro-blue text-white pb-4">
                  <CardTitle className="text-xl flex items-center gap-2">
                    {getSignalIcon(pin.signalType)}
                    {pin.name}
                  </CardTitle>
                  <p className="text-sm text-blue-100">
                    Device: {getDeviceName(pin.deviceId)}
                  </p>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-700 capitalize">{pin.signalType}</span>
                    <span className="text-2xl font-bold">{value}{pin.unit}</span>
                  </div>
                  
                  {(pin.signalType === 'water-level' || pin.signalType === 'humidity') && (
                    <div>
                      <Progress 
                        value={parseFloat(value)} 
                        className="h-2 bg-gray-200"
                      />
                    </div>
                  )}

                  {pin.signalType === 'pH' && (
                    <div>
                      <Progress 
                        value={(parseFloat(value) / 14) * 100} 
                        className={`h-2 bg-gray-200 ${
                          parseFloat(value) < 6 
                            ? 'text-red-500' 
                            : parseFloat(value) > 7 
                            ? 'text-purple-500' 
                            : 'text-green-500'
                        }`}
                      />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t flex justify-between py-4">
                  <Link to={`/devices/${pin.deviceId}/details`}>
                    <Button variant="ghost" size="sm">View Details</Button>
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

export default Readings;
