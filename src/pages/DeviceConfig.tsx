
import React, { useState, useEffect } from 'react';
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
  const { 
    devices, 
    pins, 
    configurePin, 
    getPinsByDevice, 
    pinOptions, 
    dataTypes, 
    signalTypes, 
    pinModes,
    labels,
    fetchLabels
  } = useHydro();
  
  const [selectedPinId, setSelectedPinId] = useState<string>('');
  const [dataType, setDataType] = useState<string>('');
  const [signalType, setSignalType] = useState<string>('');
  const [mode, setMode] = useState<'input' | 'output'>('input');
  const [name, setName] = useState<string>('');
  const [label, setLabel] = useState<string>('');

  const device = devices.find(d => d.id === deviceId);
  const devicePins = getPinsByDevice(deviceId || '');

  useEffect(() => {
    // Refresh labels when component mounts
    fetchLabels();
  }, [fetchLabels]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deviceId || !selectedPinId) {
      toast.error('Device ID or Pin is missing');
      return;
    }

    try {
      await configurePin(
        deviceId,
        selectedPinId,
        dataType,
        signalType as any,
        mode,
        name,
        label === 'none' ? undefined : label
      );
      
      // Reset form
      setSelectedPinId('');
      setName('');
      setLabel('');
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
                <Label htmlFor="pinNumber">Pin</Label>
                <Select 
                  value={selectedPinId} 
                  onValueChange={setSelectedPinId}
                >
                  <SelectTrigger id="pinNumber">
                    <SelectValue placeholder="Select Pin" />
                  </SelectTrigger>
                  <SelectContent>
                    {pinOptions.map((pin) => (
                      <SelectItem key={pin.id} value={pin.id}>
                        {pin.name} (Pin {pin.pinNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Select value={dataType} onValueChange={setDataType}>
                  <SelectTrigger id="dataType">
                    <SelectValue placeholder="Select Data Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signalType">Signal Type</Label>
                <Select 
                  value={signalType} 
                  onValueChange={setSignalType}
                >
                  <SelectTrigger id="signalType">
                    <SelectValue placeholder="Select Signal Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {signalTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mode">Mode</Label>
                <Select 
                  value={mode} 
                  onValueChange={(value: 'input' | 'output') => setMode(value)}
                >
                  <SelectTrigger id="mode">
                    <SelectValue placeholder="Select Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {pinModes.map((modeOption) => (
                      <SelectItem key={modeOption} value={modeOption}>
                        {modeOption.charAt(0).toUpperCase() + modeOption.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Select value={label} onValueChange={setLabel}>
                  <SelectTrigger id="label">
                    <SelectValue placeholder="Select Label" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {labels.map((labelOption) => (
                      <SelectItem key={labelOption} value={labelOption}>
                        {labelOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                      <th className="text-left p-2">Label</th>
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
                        <td className="p-2">{pin.label || '-'}</td>
                        <td className="p-2">{pin.value !== undefined ? pin.value : 'No data'}</td>
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
