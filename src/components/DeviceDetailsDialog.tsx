
import React from 'react';
import { Link } from 'react-router-dom';
import { Device, useHydro } from '@/contexts/HydroContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Settings, Trash2, Code } from 'lucide-react';

interface DeviceDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: Device | null;
}

const DeviceDetailsDialog = ({ open, onOpenChange, device }: DeviceDetailsDialogProps) => {
  const { projects, deleteDevice } = useHydro();
  
  if (!device) return null;
  
  const project = projects.find(p => p.id === device.projectId);
  
  const handleDeleteDevice = async () => {
    await deleteDevice(device.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Device Details: {device.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Description</h4>
            <p className="text-sm text-gray-600">{device.description || 'No description provided'}</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Project</h4>
            <p className="text-sm text-gray-600">{project?.name || 'Unknown project'}</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Device Type</h4>
            <p className="text-sm text-gray-600 capitalize">{device.type}</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Status</h4>
            <Badge variant="outline" className={device.isConnected ? 
              "bg-green-50 text-green-600 border-green-200" : 
              "bg-red-50 text-red-600 border-red-200"}>
              {device.isConnected ? 'Connected' : 'Offline'}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Last Seen</h4>
            <p className="text-sm text-gray-600">
              {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Created</h4>
            <p className="text-sm text-gray-600">
              {new Date(device.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="flex gap-2">
            <Link to={`/devices/${device.id}/config`}>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </Link>
            <Link to={`/devices/${device.id}/code`}>
              <Button variant="outline" size="sm">
                <Code className="h-4 w-4 mr-2" />
                Code
              </Button>
            </Link>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the device and all its associated pins and data.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteDevice} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceDetailsDialog;
