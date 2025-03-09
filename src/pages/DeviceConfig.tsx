
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHydro } from '@/contexts/HydroContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const DeviceConfig = () => {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const { devices, pins, configurePin, getPinsByDevice } = useHydro();
  
  const [pinNumber, setPinNumber] = useState<number>(0);
  const [dataType, setDataType] = useState<'analog' | 'digital'>('digital');
  const [signalType, setSignalType] = useState<'pH' | 'temperature' | 'humidity' | 'water-level' | 'nutrient' | 'light' | 'custom'>('custom');
  const [mode, setMode] = useState<'input' | 'output'>('input');
  const [name, setName] = useState<string>('');
  const [unit, setUnit] = useState<string>('');

  const device = devices.find(d => d.id === deviceId);
  const devicePins = getPinsByDevice(deviceId || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deviceId) {
      toast.error('Device ID is missing');
      return;
    }

    try {
      await configurePin(
        deviceId,
        pinNumber,
        dataType,
        signalType,
        mode,
        name,
        unit
      );
      
      // Reset form
      setPinNumber(0);
      setName('');
      setUnit('');
    } catch (error) {
      toast.error('Failed to configure pin');
      console.error(error);
    }
  };

  if (!device) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Device not found</h1>
        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{device.name} Configuration</h1>
          <p className="text-gray-500">{device.description}</p>
        </div>
        <Button onClick={() => navigate(`/devices/${deviceId}/code`)}>View Device Code</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Configure New Pin</CardTitle>
            <CardDescription>Set up a new pin for your device</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pinNumber">Pin Number</Label>
                <Input 
                  id="pinNumber" 
                  type="number" 
                  min="0" 
                  max="40" 
                  value={pinNumber} 
                  onChange={(e) => setPinNumber(parseInt(e.target.value))} 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Pin Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g., pH Sensor" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dataType">Data Type</Label>
                <Select value={dataType} onValueChange={(value: 'analog' | 'digital') => setDataType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Data Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="analog">Analog</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signalType">Signal Type</Label>
                <Select 
                  value={signalType} 
                  onValueChange={(value: 'pH' | 'temperature' | 'humidity' | 'water-level' | 'nutrient' | 'light' | 'custom') => setSignalType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Signal Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pH">pH</SelectItem>
                    <SelectItem value="temperature">Temperature</SelectItem>
                    <SelectItem value="humidity">Humidity</SelectItem>
                    <SelectItem value="water-level">Water Level</SelectItem>
                    <SelectItem value="nutrient">Nutrient</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mode">Mode</Label>
                <Select value={mode} onValueChange={(value: 'input' | 'output') => setMode(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="input">Input</SelectItem>
                    <SelectItem value="output">Output</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit">Unit (optional)</Label>
                <Input 
                  id="unit" 
                  value={unit} 
                  onChange={(e) => setUnit(e.target.value)} 
                  placeholder="e.g., °C, %, pH" 
                />
              </div>
              
              <Button type="submit" className="w-full">Configure Pin</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Configured Pins</CardTitle>
            <CardDescription>Currently configured pins for this device</CardDescription>
          </CardHeader>
          <CardContent>
            {devicePins.length === 0 ? (
              <p className="text-muted-foreground">No pins configured yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Pin</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Signal</th>
                      <th className="text-left p-2">Mode</th>
                      <th className="text-left p-2">Unit</th>
                      <th className="text-left p-2">Last Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devicePins.map((pin) => (
                      <tr key={pin.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">{pin.pinNumber}</td>
                        <td className="p-2">{pin.name}</td>
                        <td className="p-2">{pin.dataType}</td>
                        <td className="p-2">{pin.signalType}</td>
                        <td className="p-2">{pin.mode}</td>
                        <td className="p-2">{pin.unit || '-'}</td>
                        <td className="p-2">{pin.value || 'No data'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeviceConfig;
