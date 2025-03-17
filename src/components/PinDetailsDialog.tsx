
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Pin } from '@/contexts/HydroContext';
import { Button } from '@/components/ui/button';

interface PinDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pin: Pin | null;
}

const PinDetailsDialog: React.FC<PinDetailsDialogProps> = ({ open, onOpenChange, pin }) => {
  if (!pin) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{pin.name}</DialogTitle>
          <DialogDescription>
            Pin details and configuration
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-500">Pin Type</div>
              <div className="capitalize">{pin.signal_type}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Pin Mode</div>
              <div className="capitalize">{pin.mode}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Pin Number</div>
              <div>{pin.pin_number}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Data Type</div>
              <div className="capitalize">{pin.data_type}</div>
            </div>
            {pin.unit && (
              <div>
                <div className="text-sm font-medium text-gray-500">Unit</div>
                <div>{pin.unit}</div>
              </div>
            )}
            {pin.value && (
              <div>
                <div className="text-sm font-medium text-gray-500">Current Value</div>
                <div>{pin.value}{pin.unit}</div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PinDetailsDialog;
