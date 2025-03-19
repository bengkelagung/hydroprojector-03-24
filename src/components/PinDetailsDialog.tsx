
import React, { useState, useEffect } from 'react';
import { Pin, useHydro } from '@/contexts/HydroContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checkTablesExist } from '@/integrations/supabase/client';

interface PinDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pin: Pin | null;
}

const PinDetailsDialog = ({ open, onOpenChange, pin }: PinDetailsDialogProps) => {
  const { devices, projects, signalTypes, dataTypes, labels, pinModes, updatePin, deletePin, togglePinValue } = useHydro();
  
  const [editMode, setEditMode] = useState(false);
  const [editPinName, setEditPinName] = useState('');
  const [editPinSignalType, setEditPinSignalType] = useState('');
  const [editPinDataType, setEditPinDataType] = useState('');
  const [editPinLabel, setEditPinLabel] = useState('');
  const [editPinMode, setEditPinMode] = useState<'input' | 'output'>('input');
  const [tablesExist, setTablesExist] = useState<boolean>(false);
  
  // Find the device and project for this pin
  const device = pin ? devices.find(d => d.id === pin.deviceId) : null;
  const project = device ? projects.find(p => p.id === device.projectId) : null;
  
  useEffect(() => {
    // Check if tables exist
    const checkTables = async () => {
      const exist = await checkTablesExist();
      setTablesExist(exist);
    };
    
    checkTables();
  }, []);
  
  useEffect(() => {
    if (pin) {
      setEditPinName(pin.name);
      setEditPinSignalType(pin.signalType);
      setEditPinDataType(pin.dataType);
      setEditPinLabel(pin.label || '');
      setEditPinMode(pin.mode);
    }
  }, [pin]);
  
  const handleSaveEdit = async () => {
    if (!pin) return;
    
    if (editPinName.trim() === '') {
      toast.error('Pin name cannot be empty');
      return;
    }
    
    try {
      const updates: Partial<Pin> = {
        name: editPinName,
        signalType: editPinSignalType as Pin['signalType'],
        dataType: editPinDataType as Pin['dataType'],
        mode: editPinMode
      };
      
      // Only include label if the tables exist
      if (tablesExist) {
        updates.label = editPinLabel || '';
      }
      
      await updatePin(pin.id, updates);
      
      // Show success message
      toast.success(`Pin "${editPinName}" updated successfully`);
      
      // Exit edit mode
      setEditMode(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update pin');
    }
  };
  
  const handleDeletePin = async () => {
    if (!pin) return;
    
    try {
      await deletePin(pin.id);
      toast.success(`Pin "${pin.name}" deleted successfully`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete pin');
      console.error(error);
    }
  };
  
  const handleToggleOutput = () => {
    if (!pin) return;
    togglePinValue(pin.id);
  };
  
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
  
  if (!pin) return null;
  
  const value = pin.value || '0';
  const isOn = value === '1' || value.toLowerCase() === 'on' || value.toLowerCase() === 'true';
  const colorClass = getSignalColor(pin.signalType);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center">
            <div className={`w-3 h-3 rounded-full ${colorClass} mr-2`}></div>
            Pin: {pin.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {editMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Name:</Label>
                <Input
                  value={editPinName}
                  onChange={(e) => setEditPinName(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Mode:</Label>
                <Select 
                  value={editPinMode} 
                  onValueChange={(value) => setEditPinMode(value as 'input' | 'output')}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select pin mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {pinModes.map(mode => (
                      <SelectItem key={mode} value={mode}>
                        {mode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Signal Type:</Label>
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
                <Label className="text-right">Data Type:</Label>
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
              {tablesExist && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Label:</Label>
                  <Select 
                    value={editPinLabel} 
                    onValueChange={setEditPinLabel}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select label" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="none" value="_none">None</SelectItem>
                      {labels.map(label => (
                        <SelectItem key={label} value={label}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label className="text-sm font-medium">Name:</Label>
                    <div className="col-span-2">
                      <span className="text-sm">{pin.name}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label className="text-sm font-medium">Pin Number:</Label>
                    <div className="col-span-2">
                      <span className="text-sm">{pin.pinNumber}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label className="text-sm font-medium">Mode:</Label>
                    <div className="col-span-2">
                      <span className="text-sm capitalize">{pin.mode}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label className="text-sm font-medium">Signal Type:</Label>
                    <div className="col-span-2">
                      <span className="text-sm">{pin.signalType}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label className="text-sm font-medium">Data Type:</Label>
                    <div className="col-span-2">
                      <span className="text-sm">{pin.dataType}</span>
                    </div>
                  </div>
                  {pin.label && (
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label className="text-sm font-medium">Label:</Label>
                      <div className="col-span-2">
                        <span className="text-sm">{pin.label}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Current Value Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Current Value</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label className="text-sm font-medium">Value:</Label>
                    <div className="col-span-2">
                      <span className="text-sm font-medium">
                        {pin.value || 'N/A'} {pin.unit || ''}
                      </span>
                    </div>
                  </div>
                  
                  {pin.mode === 'output' && (
                    <div className="mt-4">
                      <Button 
                        onClick={handleToggleOutput}
                        variant={isOn ? "destructive" : "default"}
                        size="sm"
                      >
                        {isOn ? 'Turn Off' : 'Turn On'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Related Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Related Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label className="text-sm font-medium">Device:</Label>
                    <div className="col-span-2">
                      <span className="text-sm">{device?.name || 'Unknown'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label className="text-sm font-medium">Project:</Label>
                    <div className="col-span-2">
                      <span className="text-sm">{project?.name || 'Unknown'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        
        <DialogFooter className="border-t pt-4">
          {editMode ? (
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={() => setEditMode(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveEdit} className="bg-hydro-blue hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          ) : (
            <div className="flex justify-between w-full">
              <div className="flex space-x-2">
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
              </div>
              <Button type="button" onClick={() => setEditMode(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PinDetailsDialog;
