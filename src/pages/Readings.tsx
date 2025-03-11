
import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Droplet, ThermometerIcon, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useHydro } from '@/contexts/HydroContext';

const Readings = () => {
  const { pins, devices, projects } = useHydro();
  
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

  const inputPins = pins.filter(p => p.mode === 'input');
  const signalTypes = ['pH', 'temperature', 'humidity', 'water-level', 'nutrient', 'light', 'custom'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-bold text-gray-800">Sensor Readings</h2>
      </div>

      {inputPins.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
          <div className="mb-4 inline-flex p-3 bg-gray-100 rounded-full">
            <Activity className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No sensor data yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Configure your device pins to start collecting sensor data.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {signalTypes.map(signalType => {
            const matchingPins = pins.filter(p => p.signalType === signalType && p.mode === 'input');
            if (matchingPins.length === 0) return null;
            
            return (
              <Card key={signalType} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className={`bg-opacity-10 ${getSignalColor(signalType).replace('bg-', 'bg-opacity-10 bg-')}`}>
                  <div className="flex items-center">
                    {signalType === 'pH' && <Droplet className="h-5 w-5 mr-2 text-purple-500" />}
                    {signalType === 'temperature' && <ThermometerIcon className="h-5 w-5 mr-2 text-orange-500" />}
                    {signalType === 'water-level' && <Droplet className="h-5 w-5 mr-2 text-cyan-500" />}
                    {signalType === 'humidity' && <Droplet className="h-5 w-5 mr-2 text-blue-500" />}
                    {(signalType === 'custom' || signalType === 'nutrient' || signalType === 'light') && (
                      <Activity className="h-5 w-5 mr-2 text-gray-500" />
                    )}
                    <CardTitle className="capitalize">{signalType} Readings</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {matchingPins.map(pin => {
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
                      if (signalType === 'pH' && (parseFloat(value) < 5.5 || parseFloat(value) > 7.5)) {
                        alert = true;
                      } else if (signalType === 'temperature' && (parseFloat(value) < 18 || parseFloat(value) > 28)) {
                        alert = true;
                      } else if (signalType === 'water-level' && parseFloat(value) < 40) {
                        alert = true;
                      }
                      
                      if (!device) return null;
                      
                      return (
                        <div key={pin.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-gray-800">{pin.name}</h4>
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
                          
                          {/* Mock visual indicator appropriate to the type of sensor */}
                          {signalType === 'pH' && (
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${parseFloat(value) < 6 ? 'bg-red-500' : parseFloat(value) > 7 ? 'bg-purple-500' : 'bg-green-500'}`} 
                                style={{ width: `${(parseFloat(value) / 14) * 100}%` }}
                              ></div>
                            </div>
                          )}
                          {(signalType === 'water-level' || signalType === 'humidity' || signalType === 'nutrient') && (
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${parseFloat(value) < 30 ? 'bg-red-500' : parseFloat(value) < 60 ? 'bg-amber-500' : 'bg-green-500'}`} 
                                style={{ width: `${parseFloat(value)}%` }}
                              ></div>
                            </div>
                          )}
                          {signalType === 'temperature' && (
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${parseFloat(value) < 18 ? 'bg-blue-500' : parseFloat(value) > 28 ? 'bg-red-500' : 'bg-green-500'}`} 
                                style={{ width: `${(parseFloat(value) / 40) * 100}%` }}
                              ></div>
                            </div>
                          )}
                          
                          <div className="mt-2 text-right">
                            <Link to={`/devices/${device.id}/details`}>
                              <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-700">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Readings;
