
import React, { useState } from 'react';
import { Activity, Droplet, ThermometerIcon, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHydro } from '@/contexts/HydroContext';
import { Link } from 'react-router-dom';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const Readings = () => {
  const { pins, devices, projects, deletePin, configurePin, signalTypes, dataTypes, pinModes } = useHydro();
  const [selectedPin, setSelectedPin] = useState<typeof pins[0] | null>(null);
  const [editPinName, setEditPinName] = useState('');
  const [editPinSignalType, setEditPinSignalType] = useState<string>('');
  const [editPinDataType, setEditPinDataType] = useState<string>('');
  const [editPinUnit, setEditPinUnit] = useState<string>('');
  
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

  // Get all input pins
  const inputPins = pins.filter(p => p.mode === 'input');

  const handleOpenPinEdit = (pin: typeof pins[0]) => {
    setSelectedPin(pin);
    setEditPinName(pin.name);
    setEditPinSignalType(pin.signalType);
    setEditPinDataType(pin.dataType);
    setEditPinUnit(pin.unit || '');
  };

  const handleSaveEdit = async () => {
    if (!selectedPin) return;
    
    if (editPinName.trim() === '') {
      toast.error('Pin name cannot be empty');
      return;
    }
    
    try {
      await configurePin(
        selectedPin.deviceId,
        selectedPin.pinNumber,
        editPinDataType,
        editPinSignalType as any,
        selectedPin.mode,
        editPinName,
        editPinUnit || undefined
      );
      
      toast.success('Pin updated successfully');
      setSelectedPin(null);
    } catch (error) {
      toast.error('Failed to update pin');
      console.error(error);
    }
  };
  
  const handleDeletePin = async () => {
    if (!selectedPin) return;
    
    try {
      deletePin(selectedPin.id);
      toast.success(`Pin "${selectedPin.name}" deleted successfully`);
      setSelectedPin(null);
    } catch (error) {
      toast.error('Failed to delete pin');
      console.error(error);
    }
  };

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
          {inputPins.map(pin => {
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
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="link" 
                              className="p-0 h-auto text-sm text-blue-600 hover:text-blue-800"
                              onClick={() => handleOpenPinEdit(pin)}
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Pin Details: {selectedPin?.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-right text-sm font-medium">Name:</label>
                                <Input
                                  value={editPinName}
                                  onChange={(e) => setEditPinName(e.target.value)}
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-right text-sm font-medium">Signal Type:</label>
                                <Select 
                                  value={editPinSignalType} 
                                  onValueChange={setEditPinSignalType}
                                >
                                  <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select signal type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {signalTypes.map(type => (
                                      <SelectItem key={type} value={type}>
                                        {type}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-right text-sm font-medium">Data Type:</label>
                                <Select 
                                  value={editPinDataType} 
                                  onValueChange={setEditPinDataType}
                                >
                                  <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select data type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {dataTypes.map(type => (
                                      <SelectItem key={type} value={type}>
                                        {type}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-right text-sm font-medium">Unit:</label>
                                <Input
                                  value={editPinUnit}
                                  onChange={(e) => setEditPinUnit(e.target.value)}
                                  className="col-span-3"
                                  placeholder="°C, %, pH, etc."
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-right text-sm font-medium">Pin:</label>
                                <div className="col-span-3">
                                  <span className="text-gray-700">{selectedPin?.pinNumber}</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-right text-sm font-medium">Mode:</label>
                                <div className="col-span-3">
                                  <span className="text-gray-700 capitalize">{selectedPin?.mode}</span>
                                </div>
                              </div>
                            </div>
                            <DialogFooter className="flex justify-between">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" type="button">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete the pin and all associated data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeletePin} className="bg-red-600 hover:bg-red-700">
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <Button type="button" onClick={handleSaveEdit}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Save
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
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
