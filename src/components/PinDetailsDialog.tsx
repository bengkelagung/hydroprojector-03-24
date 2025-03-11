
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Trash2, Activity, Droplet, ThermometerIcon, Power } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useHydro } from '@/contexts/HydroContext';

interface Pin {
  id: string;
  deviceId: string;
  pinNumber: number;
  name: string;
  mode: string;
  signalType: string;
  value?: string;
  unit?: string;
}

interface PinDetailsDialogProps {
  pin: Pin;
  trigger?: React.ReactNode;
}

const PinDetailsDialog = ({ pin, trigger }: PinDetailsDialogProps) => {
  const { devices, updatePin, deletePin, togglePinValue } = useHydro();
  const device = devices.find(d => d.id === pin.deviceId);
  
  const [isOpen, setIsOpen] = useState(false);
  const [editName, setEditName] = useState(pin.name);
  const [editSignalType, setEditSignalType] = useState(pin.signalType);
  const [editUnit, setEditUnit] = useState(pin.unit || '');

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

  // Get icon based on signal type
  const getSignalIcon = () => {
    switch (pin.signalType) {
      case 'pH': return <Droplet className="h-5 w-5 text-purple-500" />;
      case 'temperature': return <ThermometerIcon className="h-5 w-5 text-orange-500" />;
      case 'water-level': 
      case 'humidity': return <Droplet className="h-5 w-5 text-blue-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

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

  // Determine alert status (just for UI demonstration)
  let alert = false;
  if (pin.signalType === 'pH' && (parseFloat(value) < 5.5 || parseFloat(value) > 7.5)) {
    alert = true;
  } else if (pin.signalType === 'temperature' && (parseFloat(value) < 18 || parseFloat(value) > 28)) {
    alert = true;
  } else if (pin.signalType === 'water-level' && parseFloat(value) < 40) {
    alert = true;
  }

  const handleSave = () => {
    if (editName.trim() === '') {
      toast({
        title: "Error",
        description: "Pin name cannot be empty",
        variant: "destructive"
      });
      return;
    }

    updatePin(pin.id, {
      name: editName,
      signalType: editSignalType,
      unit: editUnit
    });

    toast({
      title: "Pin updated",
      description: "The pin has been updated successfully"
    });
    
    setIsOpen(false);
  };

  const handleDelete = () => {
    deletePin(pin.id);
    
    toast({
      title: "Pin deleted",
      description: `The pin "${pin.name}" has been deleted`
    });
    
    setIsOpen(false);
  };

  const handleToggle = () => {
    togglePinValue(pin.id);
    
    toast({
      title: `${pin.value === "1" ? "Turned off" : "Turned on"}`,
      description: `${pin.name} has been ${pin.value === "1" ? "turned off" : "turned on"}`
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="link">View Details</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getSignalIcon()}
            Pin Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getSignalColor(pin.signalType)}`}></div>
              <span className="font-semibold">{device?.name}</span>
            </div>
            <Badge variant={pin.mode === 'input' ? 'secondary' : 'default'}>
              {pin.mode.toUpperCase()}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Pin Name</Label>
              <Input 
                id="name" 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pinNumber">Pin Number</Label>
              <Input 
                id="pinNumber" 
                value={pin.pinNumber.toString()}
                disabled
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signalType">Signal Type</Label>
              <Select value={editSignalType} onValueChange={setEditSignalType}>
                <SelectTrigger id="signalType">
                  <SelectValue placeholder="Select signal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pH">pH Sensor</SelectItem>
                  <SelectItem value="temperature">Temperature</SelectItem>
                  <SelectItem value="humidity">Humidity</SelectItem>
                  <SelectItem value="water-level">Water Level</SelectItem>
                  <SelectItem value="nutrient">Nutrient</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="pump">Pump Control</SelectItem>
                  <SelectItem value="valve">Valve Control</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input 
                id="unit" 
                value={editUnit} 
                onChange={(e) => setEditUnit(e.target.value)}
                placeholder="e.g., °C, %, pH"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Current Reading</Label>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <span>Current Value</span>
              <span className={`font-semibold ${alert ? 'text-amber-500' : 'text-gray-800'}`}>
                {value}{pin.unit}
              </span>
            </div>
          </div>
          
          {pin.mode === 'output' && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <span>Status</span>
              <div className="flex items-center gap-2">
                <Badge variant={pin.value === "1" ? "default" : "outline"}>
                  {pin.value === "1" ? "ON" : "OFF"}
                </Badge>
                <Button 
                  size="sm" 
                  variant={pin.value === "1" ? "default" : "outline"} 
                  className={pin.value === "1" ? "bg-green-600 hover:bg-green-700" : "text-gray-600 hover:bg-gray-100"}
                  onClick={handleToggle}
                >
                  <Power className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Pin
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this pin?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the pin "{pin.name}" and all its historical data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button type="submit" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PinDetailsDialog;
