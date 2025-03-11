import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Cpu, Settings, Code, Activity, Pencil, Trash2, Power, AlertTriangle, Info, CircleInfo } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHydro } from '@/contexts/HydroContext';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { toast } from "sonner";

const DeviceDetails = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { 
    devices, 
    projects, 
    pins, 
    getPinsByDevice, 
    updateDevice, 
    deleteDevice, 
    deletePin,
    configurePin,
    togglePinValue,
    signalTypes,
    dataTypes,
    pinModes
  } = useHydro();
  
  const device = devices.find(d => d.id === deviceId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(device?.name || '');
  const [editDescription, setEditDescription] = useState(device?.description || '');
  const [editProjectId, setEditProjectId] = useState(device?.projectId || '');
  
  // Pin editing state
  const [selectedPin, setSelectedPin] = useState<typeof pins[0] | null>(null);
  const [editPinName, setEditPinName] = useState('');
  const [editPinSignalType, setEditPinSignalType] = useState<string>('');
  const [editPinDataType, setEditPinDataType] = useState<string>('');
  const [editPinUnit, setEditPinUnit] = useState<string>('');
  
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

  const project = projects.find(p => p.id === device.projectId);
  const devicePins = getPinsByDevice(device.id);
  const inputPins = devicePins.filter(p => p.mode === 'input');
  const outputPins = devicePins.filter(p => p.mode === 'output');
  
  const handleSaveEdit = () => {
    if (editName.trim() === '') {
      toast({
        title: "Error",
        description: "Device name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    updateDevice(device.id, {
      name: editName,
      description: editDescription,
      projectId: editProjectId
    });
    
    setIsEditing(false);
    toast({
      title: "Device updated",
      description: "The device has been updated successfully",
    });
  };
  
  const handleDeleteDevice = () => {
    deleteDevice(device.id);
    toast({
      title: "Device deleted",
      description: "The device and all associated pins have been deleted",
    });
    navigate('/devices');
  };
  
  const handleDeletePin = (pinId: string, pinName: string) => {
    deletePin(pinId);
    toast({
      title: "Pin deleted",
      description: `The pin "${pinName}" has been deleted`,
    });
  };
  
  const handleTogglePin = (pinId: string, pinName: string, currentValue: string) => {
    togglePinValue(pinId);
    toast({
      title: `${currentValue === "1" ? "Turned off" : "Turned on"}`,
      description: `${pinName} has been ${currentValue === "1" ? "turned off" : "turned on"}`,
    });
  };

  const handleOpenPinEdit = (pin: typeof pins[0]) => {
    setSelectedPin(pin);
    setEditPinName(pin.name);
    setEditPinSignalType(pin.signalType);
    setEditPinDataType(pin.dataType);
    setEditPinUnit(pin.unit || '');
  };

  const handleSavePinEdit = async () => {
    if (!selectedPin) return;
    
    if (editPinName.trim() === '') {
      toast({
        title: "Error",
        description: "Pin name cannot be empty",
        variant: "destructive"
      });
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
      
      toast({
        title: "Success",
        description: "Pin updated successfully"
      });
      setSelectedPin(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update pin",
        variant: "destructive"
      });
      console.error(error);
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
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Name</h3>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Device name"
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Device description"
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Project</h3>
                    <Select value={editProjectId} onValueChange={setEditProjectId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
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
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              {isEditing ? (
                <div className="flex space-x-2 w-full">
                  <Button variant="outline" className="w-full" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button className="w-full bg-hydro-blue hover:bg-blue-700" onClick={handleSaveEdit}>
                    Save Changes
                  </Button>
                </div>
              ) : (
                <div className="flex space-x-2 w-full">
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Device
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full sm:w-auto">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Device
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the device
                          "{device.name}" and all associated pins and data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteDevice} className="bg-red-600 hover:bg-red-700">
                          Yes, delete device
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
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
                        
                        // Determine alert status
                        let alert = false;
                        let statusText = "Normal";
                        if (pin.signalType === 'pH') {
                          if (parseFloat(value) < 5.5) {
                            alert = true;
                            statusText = "Too Acidic";
                          } else if (parseFloat(value) > 7.5) {
                            alert = true;
                            statusText = "Too Alkaline";
                          }
                        } else if (pin.signalType === 'temperature') {
                          if (parseFloat(value) < 18) {
                            alert = true;
                            statusText = "Too Cold";
                          } else if (parseFloat(value) > 28) {
                            alert = true;
                            statusText = "Too Hot";
                          }
                        } else if (pin.signalType === 'water-level') {
                          if (parseFloat(value) < 40) {
                            alert = true;
                            statusText = "Low Water";
                          }
                        } else if (pin.signalType === 'humidity') {
                          if (parseFloat(value) < 30) {
                            alert = true;
                            statusText = "Too Dry";
                          } else if (parseFloat(value) > 80) {
                            alert = true;
                            statusText = "Too Humid";
                          }
                        }
                        
                        return (
                          <div key={pin.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full ${getSignalColor(pin.signalType)}`}></div>
                              <div className="ml-3">
                                <h4 className="font-medium text-gray-800">{pin.name}</h4>
                                <p className="text-xs text-gray-500 capitalize">{pin.signalType} Sensor (Pin {pin.pinNumber})</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <div className="mr-3 text-right">
                                <div className="font-semibold text-gray-800">
                                  {value}{pin.unit}
                                </div>
                                <div className={`text-xs ${alert ? 'text-amber-500 font-medium' : 'text-green-600'}`}>
                                  {statusText}
                                </div>
                              </div>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-blue-600 hover:bg-blue-50 mr-1"
                                    onClick={() => handleOpenPinEdit(pin)}
                                  >
                                    <CircleInfo className="h-4 w-4" />
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
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <label className="text-right text-sm font-medium">Status:</label>
                                      <div className="col-span-3">
                                        <Badge 
                                          variant="outline" 
                                          className={alert ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-green-50 text-green-600 border-green-200"}
                                        >
                                          {statusText}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <label className="text-right text-sm font-medium">Last Reading:</label>
                                      <div className="col-span-3">
                                        <span className="font-medium">{value}{pin.unit}</span>
                                        <span className="text-xs text-gray-500 ml-2">
                                          (Updated {new Date().toLocaleTimeString()})
                                        </span>
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
                                          <AlertDialogAction 
                                            onClick={() => {
                                              if (selectedPin) {
                                                handleDeletePin(selectedPin.id, selectedPin.name);
                                                setSelectedPin(null);
                                              }
                                            }} 
                                            className="bg-red-600 hover:bg-red-700"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                    <Button type="button" onClick={handleSavePinEdit}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Save
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
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
                          <div className="flex items-center">
                            <div className="mr-3">
                              <Badge variant={pin.value === "1" ? "default" : "outline"} className="mr-2">
                                {pin.value === "1" ? "ON" : "OFF"}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                Last toggled: {new Date().toLocaleTimeString()}
                              </span>
                            </div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-blue-600 hover:bg-blue-50 mr-1"
                                  onClick={() => handleOpenPinEdit(pin)}
                                >
                                  <CircleInfo className="h-4 w-4" />
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
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right text-sm font-medium">Status:</label>
                                    <div className="col-span-3">
                                      <Badge 
                                        variant={pin.value === "1" ? "default" : "outline"}
                                      >
                                        {pin.value === "1" ? "ON" : "OFF"}
                                      </Badge>
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
                                        <AlertDialogAction 
                                          onClick={() => {
                                            if (selectedPin) {
                                              handleDeletePin(selectedPin.id, selectedPin.name);
                                              setSelectedPin(null);
                                            }
                                          }} 
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  <Button type="button" onClick={handleSavePinEdit}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Save
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button 
                              size="sm" 
                              variant={pin.value === "1" ? "default" : "outline"} 
                              className={pin.value === "1" ? "bg-green-600 hover:bg-green-700 mr-2" : "text-gray-600 hover:bg-gray-100 mr-2"}
                              onClick={() => handleTogglePin(pin.id, pin.name, pin.value || "0")}
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-blue-600 hover:bg-blue-50"
                                  onClick={() => {
                                    handleOpenPinEdit(pin);
                                    document.querySelector('[data-trigger="dialog"]')?.click();
                                  }}
                                >
                                  <Info className="h-4 w-4" />
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
                                    <div className="col-span
