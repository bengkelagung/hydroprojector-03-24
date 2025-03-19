import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { useForm } from "react-hook-form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createPinConfig, updatePinConfig } from '@/server/actions/pinConfig';
import { fetchPinConfigsWithRelations } from '@/integrations/supabase/client';
import { useUser } from '@clerk/nextjs';
import { handleSupabaseError } from '@/utils/supabaseHelpers';

interface PinConfig {
  id?: string;
  pinId: string;
  name: string;
  dataType: string;
  signalType: string;
  mode: string;
  label?: string;
  unit: string;
}

export default function DeviceConfig() {
  const router = useRouter();
  const { deviceId } = router.query;
  const { toast } = useToast();
  const { user } = useUser();

  const [selectedPin, setSelectedPin] = useState<{ id: string; pin_number: number; pin_name: string } | null>(null);
  const [pinName, setPinName] = useState('');
  const [dataType, setDataType] = useState<string | null>(null);
  const [signalType, setSignalType] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [unit, setUnit] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedPin || !pinName) return;
    
    setIsSaving(true);
    try {
      // Call configurePin with deviceId and the configuration object
      await configurePin(deviceId as string, {
        pinId: selectedPin.id,
        name: pinName,
        dataType: dataType || 'Analog',
        signalType: signalType || 'Sensor',
        mode: mode || 'Input',
        label: selectedLabel || undefined,
        unit: unit || ''
      });
      
      toast({
        title: "Success",
        description: "Pin configuration saved successfully.",
      });
    } catch (error: any) {
      handleSupabaseError(error, "Failed to save pin configuration.");
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Card className="w-[500px]">
      <CardHeader>
        <CardTitle>Configure Pin</CardTitle>
        <CardDescription>Set up the pin configuration for your device.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="pin">Pin</Label>
            <Select onValueChange={(value) => setSelectedPin(JSON.parse(value))}>
              <SelectTrigger id="pin">
                <SelectValue placeholder="Select a pin" />
              </SelectTrigger>
              <SelectContent>
                {/* Assuming you have a way to fetch available pins */}
                <SelectItem value='{"id":"1", "pin_number":1, "pin_name":"D1"}'>D1</SelectItem>
                <SelectItem value='{"id":"2", "pin_number":2, "pin_name":"D2"}'>D2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Pin Name" value={pinName} onChange={(e) => setPinName(e.target.value)} />
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="dataType">Data Type</Label>
            <Select onValueChange={setDataType}>
              <SelectTrigger id="dataType">
                <SelectValue placeholder="Select data type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Analog">Analog</SelectItem>
                <SelectItem value="Digital">Digital</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="signalType">Signal Type</Label>
            <Select onValueChange={setSignalType}>
              <SelectTrigger id="signalType">
                <SelectValue placeholder="Select signal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sensor">Sensor</SelectItem>
                <SelectItem value="Actuator">Actuator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="mode">Mode</Label>
            <Select onValueChange={setMode}>
              <SelectTrigger id="mode">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Input">Input</SelectItem>
                <SelectItem value="Output">Output</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="label">Label</Label>
            <Select onValueChange={setSelectedLabel}>
              <SelectTrigger id="label">
                <SelectValue placeholder="Select label" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pH">pH</SelectItem>
                <SelectItem value="Temperature">Temperature</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="unit">Unit</Label>
            <Input id="unit" placeholder="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </CardFooter>
    </Card>
  );
}

async function configurePin(deviceId: string | undefined, config: PinConfig): Promise<void> {
  if (!deviceId) {
    throw new Error("Device ID is required to configure the pin.");
  }

  const userId = 'user123'; // Replace with actual user ID

  try {
    // Map string values to IDs
    // const dataTypeId = await findDataTypeIdByName(config.dataType);
    // const signalTypeId = await findSignalTypeIdByName(config.signalType);
    // const modeId = await findModeIdByType(config.mode);
    // const labelId = config.label ? await findLabelIdByName(config.label) : null;

    // if (!dataTypeId || !signalTypeId || !modeId) {
    //   throw new Error("Failed to resolve IDs for data type, signal type, or mode.");
    // }

    // Prepare the pin configuration object
    const pinConfigData = {
      device_id: deviceId,
      pin_id: config.pinId,
      data_type_id: 1, //dataTypeId,
      signal_type_id:  1, //signalTypeId,
      mode_id: 1, //modeId,
      label_id: 1, //labelId,
      name: config.name,
      unit: config.unit,
    };

    // Call the server action to create the pin configuration
    await createPinConfig(pinConfigData);
  } catch (error) {
    console.error("Error during pin configuration:", error);
    throw error;
  }
}
