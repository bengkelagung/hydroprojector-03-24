
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
import { toast } from "sonner";
import { Trash2, Activity, Droplet, ThermometerIcon } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useHydro } from '@/contexts/HydroContext';
import type { SignalType } from '@/contexts/HydroContext';

interface Pin {
  id: string;
  deviceId: string;
  pinNumber: number;
  name: string;
  mode: string;
  signalType: SignalType;
  value?: string;
  unit?: string;
}

interface PinDetailsDialogProps {
  pin: Pin;
  trigger?: React.ReactNode;
}

const PinDetailsDialog = ({ pin, trigger }: PinDetailsDialogProps) => {
  const { devices, updatePin, deletePin } = useHydro();
  const device = devices.find(d => d.id === pin.deviceId);
  
  const [isOpen, setIsOpen] = useState(false);
  const [editName, setEditName] = useState(pin.name);
  const [editSignalType, setEditSignalType] = useState<SignalType>(pin.signalType);
  const [editUnit, setEditUnit] = useState(pin.unit || '');

  const handleSave = () => {
    if (editName.trim() === '') {
      toast.error("Pin name cannot be empty");
      return;
    }

    updatePin(pin.id, {
      name: editName,
      signalType: editSignalType,
      unit: editUnit
    });
    
    setIsOpen(false);
  };

  const handleDelete = () => {
    deletePin(pin.id);
    toast.success(`Pin "${pin.name}" has been deleted`);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="link">View Details</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pin Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <div className="flex items-center gap-2">
              <Badge variant={pin.mode === 'input' ? 'secondary' : 'default'}>
                {pin.mode.toUpperCase()}
              </Badge>
              <span className="font-semibold">{device?.name}</span>
            </div>
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
              <Select value={editSignalType} onValueChange={(value: SignalType) => setEditSignalType(value)}>
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
              <span className="font-semibold">
                {pin.value}{pin.unit}
              </span>
            </div>
          </div>
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
