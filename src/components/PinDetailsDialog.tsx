
import React, { useState, useEffect } from 'react';
import { Pin, useHydro } from '@/contexts/HydroContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2 } from 'lucide-react';
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
import { checkLabelColumnExists } from '@/integrations/supabase/client';

interface PinDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pin: Pin | null;
}

const PinDetailsDialog = ({ open, onOpenChange, pin }: PinDetailsDialogProps) => {
  const { devices, projects, signalTypes, dataTypes, labels, updatePin, deletePin } = useHydro();
  
  const [editPinName, setEditPinName] = useState('');
  const [editPinSignalType, setEditPinSignalType] = useState<string>('');
  const [editPinDataType, setEditPinDataType] = useState<string>('');
  const [editPinLabel, setEditPinLabel] = useState<string>('');
  const [hasLabelColumn, setHasLabelColumn] = useState<boolean>(false);
  
  // Find the device and project for this pin
  const device = pin ? devices.find(d => d.id === pin.deviceId) : null;
  const project = device ? projects.find(p => p.id === device.projectId) : null;
  
  useEffect(() => {
    // Check if label column exists
    const checkColumn = async () => {
      const exists = await checkLabelColumnExists();
      setHasLabelColumn(exists);
    };
    
    checkColumn();
  }, []);
  
  useEffect(() => {
    if (pin) {
      setEditPinName(pin.name);
      setEditPinSignalType(pin.signalType);
      setEditPinDataType(pin.dataType);
      setEditPinLabel(pin.label || '');
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
        signalType: editPinSignalType as any,
        dataType: editPinDataType
      };
      
      // Only include label if the column exists
      if (hasLabelColumn) {
        updates.label = editPinLabel || '';
      }
      
      await updatePin(pin.id, updates);
      
      onOpenChange(false);
    } catch (error) {
      console.error(error);
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
  
  if (!pin) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pin Details: {pin.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Name:</Label>
            <Input
              value={editPinName}
              onChange={(e) => setEditPinName(e.target.value)}
              className="col-span-3"
            />
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
          {hasLabelColumn && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Label:</Label>
              <Select 
                value={editPinLabel || ''} 
                onValueChange={setEditPinLabel}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select label" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {labels.map(label => (
                    <SelectItem key={label} value={label}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Pin:</Label>
            <div className="col-span-3">
              <span className="text-gray-700">{pin.pinNumber}</span>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Mode:</Label>
            <div className="col-span-3">
              <span className="text-gray-700 capitalize">{pin.mode}</span>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Device:</Label>
            <div className="col-span-3">
              <span className="text-gray-700">{device?.name || 'Unknown'}</span>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Project:</Label>
            <div className="col-span-3">
              <span className="text-gray-700">{project?.name || 'Unknown'}</span>
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
  );
};

export default PinDetailsDialog;
