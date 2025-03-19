
import React, { useState, useEffect } from 'react';
import { Droplet, ThermometerIcon, AlertTriangle, Cloud, LightbulbIcon, Waves, Flower, Power, FileInput, FileOutput, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHydro, Pin } from '@/contexts/HydroContext';
import { Button } from '@/components/ui/button';
import PinDetailsDialog from '@/components/PinDetailsDialog';
import { checkLabelColumnExists } from '@/integrations/supabase/client';
import { toast } from "sonner";
import SensorReadingCard from '@/components/SensorReadingCard';

const Readings = () => {
  const { pins, devices, projects, togglePinValue } = useHydro();
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [isPinDetailsOpen, setIsPinDetailsOpen] = useState(false);
  const [hasLabelColumn, setHasLabelColumn] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'input' | 'output'>('input');
  const [localPinValues, setLocalPinValues] = useState<Record<string, string>>({});
  
  useEffect(() => {
    // Check if label column exists
    const checkColumn = async () => {
      const exists = await checkLabelColumnExists();
      setHasLabelColumn(exists);
    };
    
    checkColumn();
  }, []);

  // Initialize local pin values from actual pins
  useEffect(() => {
    const values: Record<string, string> = {};
    pins.forEach(pin => {
      values[pin.id] = pin.value || '0';
    });
    setLocalPinValues(values);
  }, [pins]);

  // Get all pins
  const inputPins = pins.filter(p => p.mode === 'input');
  const outputPins = pins.filter(p => p.mode === 'output');

  const handleOpenPinDetails = (pin: Pin) => {
    setSelectedPin(pin);
    setIsPinDetailsOpen(true);
  };

  const handleToggleOutput = async (pinId: string) => {
    try {
      // Update local state immediately for better UX
      const currentValue = localPinValues[pinId] || '0';
      const newValue = currentValue === '1' ? '0' : '1';
      
      // Update local state
      setLocalPinValues(prev => ({
        ...prev,
        [pinId]: newValue
      }));
      
      // Then call the actual toggle function - using await to catch any errors
      await togglePinValue(pinId);
      
      // Find the pin to get its name
      const pin = pins.find(p => p.id === pinId);
      
      // Show toast notification
      toast.success(`${pin?.name || 'Pin'} turned ${newValue === '1' ? 'on' : 'off'}`);
    } catch (error) {
      console.error('Error toggling pin:', error);
      // Revert the local state if there was an error
      setLocalPinValues(prev => ({
        ...prev,
        [pinId]: localPinValues[pinId] || '0'
      }));
      toast.error('Failed to toggle pin');
    }
  };

  // Helper function to get an icon based on label or signal type
  const getPinIcon = (pin: Pin) => {
    const label = pin.label || '';
    const signalType = pin.signalType;
    
    switch (label.toLowerCase()) {
      case 'ph':
        return <Droplet className="h-5 w-5 mr-2 text-purple-500" />;
      case 'suhu':
        return <ThermometerIcon className="h-5 w-5 mr-2 text-orange-500" />;
      case 'kelembaban':
        return <Cloud className="h-5 w-5 mr-2 text-blue-500" />;
      case 'lampu':
        return <LightbulbIcon className="h-5 w-5 mr-2 text-yellow-500" />;
      case 'pompa':
        return <Power className="h-5 w-5 mr-2 text-green-500" />;
      case 'level air':
        return <Waves className="h-5 w-5 mr-2 text-cyan-500" />;
      default:
        // Fallback to signal type if no label
        switch (signalType) {
          case 'pH': return <Droplet className="h-5 w-5 mr-2 text-purple-500" />;
          case 'temperature': return <ThermometerIcon className="h-5 w-5 mr-2 text-orange-500" />;
          case 'humidity': return <Cloud className="h-5 w-5 mr-2 text-blue-500" />;
          case 'water-level': return <Waves className="h-5 w-5 mr-2 text-cyan-500" />;
          case 'light': return <LightbulbIcon className="h-5 w-5 mr-2 text-yellow-500" />;
          default: return <Activity className="h-5 w-5 mr-2 text-gray-500" />;
        }
    }
  };

  // Helper function to get a color based on label or signal type
  const getPinColor = (pin: Pin) => {
    const label = pin.label?.toLowerCase() || '';
    const signalType = pin.signalType;
    
    switch (label) {
      case 'ph': return 'bg-purple-500';
      case 'suhu': return 'bg-orange-500';
      case 'kelembaban': return 'bg-blue-500';
      case 'lampu': return 'bg-yellow-500';
      case 'pompa': return 'bg-green-500';
      case 'level air': return 'bg-cyan-500';
      default:
        // Fallback to signal type if no label
        switch (signalType) {
          case 'pH': return 'bg-purple-500';
          case 'temperature': return 'bg-orange-500';
          case 'humidity': return 'bg-blue-500';
          case 'water-level': return 'bg-cyan-500';
          case 'light': return 'bg-yellow-500';
          default: return 'bg-gray-500';
        }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-bold text-gray-800">Sensor Readings</h2>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <Button 
            variant={viewMode === 'input' ? 'default' : 'outline'}
            onClick={() => setViewMode('input')}
            className={viewMode === 'input' ? 'bg-hydro-blue hover:bg-blue-700' : ''}
          >
            <FileInput className="mr-2 h-4 w-4" />
            Input Pins
          </Button>
          <Button 
            variant={viewMode === 'output' ? 'default' : 'outline'}
            onClick={() => setViewMode('output')}
            className={viewMode === 'output' ? 'bg-hydro-blue hover:bg-blue-700' : ''}
          >
            <FileOutput className="mr-2 h-4 w-4" />
            Output Pins
          </Button>
        </div>
      </div>

      {viewMode === 'input' && (
        <>
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
            <>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">Sensor Inputs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {inputPins.map(pin => {
                  const device = devices.find(d => d.id === pin.deviceId);
                  const project = device ? projects.find(p => p.id === device.projectId) : null;
                  
                  const colorClass = getPinColor(pin);
                  const icon = getPinIcon(pin);
                  
                  return (
                    <SensorReadingCard
                      key={pin.id}
                      pin={pin}
                      deviceName={device?.name}
                      projectName={project?.name}
                      onViewDetails={handleOpenPinDetails}
                      colorClass={colorClass}
                      icon={icon}
                    />
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    
      {viewMode === 'output' && (
        <>
          {outputPins.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
              <div className="mb-4 inline-flex p-3 bg-gray-100 rounded-full">
                <Power className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No output pins configured</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Configure your device output pins to control your hydroponics system.
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">Control Outputs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {outputPins.map(pin => {
                  const device = devices.find(d => d.id === pin.deviceId);
                  const project = device ? projects.find(p => p.id === device.projectId) : null;
                  
                  const colorClass = getPinColor(pin);
                  const icon = getPinIcon(pin);
                  
                  return (
                    <SensorReadingCard
                      key={pin.id}
                      pin={pin}
                      deviceName={device?.name}
                      projectName={project?.name}
                      onViewDetails={handleOpenPinDetails}
                      onToggle={handleToggleOutput}
                      colorClass={colorClass}
                      icon={icon}
                    />
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Pin Details Dialog */}
      <PinDetailsDialog 
        open={isPinDetailsOpen}
        onOpenChange={setIsPinDetailsOpen}
        pin={selectedPin}
      />
    </div>
  );
};

export default Readings;
