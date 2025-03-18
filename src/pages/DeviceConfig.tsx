
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHydro } from '@/contexts/HydroContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { checkTablesExist } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";

// Define the form values type
type PinConfigFormValues = {
  pinId: string;
  name: string;
  dataType: string;
  signalType: string;
  label: string;
  mode: 'input' | 'output';
};

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
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tablesExist, setTablesExist] = useState<boolean>(false);

  const device = devices.find(d => d.id === deviceId);
  const devicePins = getPinsByDevice(deviceId || '');
  
  // Initialize the form with react-hook-form
  const form = useForm<PinConfigFormValues>({
    defaultValues: {
      pinId: '',
      name: '',
      dataType: '',
      signalType: '',
      label: '',
      mode: 'input'
    }
  });
  
  useEffect(() => {
    // Refresh labels when component mounts
    fetchLabels();
  }, [fetchLabels]);
  
  useEffect(() => {
    // Check if tables exist
    const checkTables = async () => {
      const exist = await checkTablesExist();
      setTablesExist(exist);
    };
    
    checkTables();
  }, []);

  const onSubmit = async (values: PinConfigFormValues) => {
    if (!deviceId) {
      toast.error('Device ID is missing');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await configurePin(
        deviceId,
        values.pinId,
        values.dataType,
        values.signalType as any,
        values.mode,
        values.name,
        values.label === 'none' ? '' : values.label
      );
      
      // Reset form
      form.reset({
        pinId: '',
        name: '',
        dataType: '',
        signalType: '',
        label: '',
        mode: 'input'
      });
      toast.success('Pin configured successfully');
    } catch (error) {
      console.error('Error configuring pin:', error);
      toast.error('Failed to configure pin');
    } finally {
      setIsSubmitting(false);
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="pinId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pin</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Pin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {pinOptions.map((pin) => (
                            <SelectItem key={pin.id} value={pin.id}>
                              {pin.name} (Pin {pin.pinNumber})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pin Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., pH Sensor" 
                          required 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dataType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Data Type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {dataTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="signalType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Signal Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Signal Type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {signalTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Label" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {labels.map((labelOption) => (
                            <SelectItem key={labelOption} value={labelOption}>
                              {labelOption}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Label determines how this pin will be displayed in the dashboard
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mode</FormLabel>
                      <Select
                        onValueChange={field.onChange as (value: string) => void}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {pinModes.map((modeOption) => (
                            <SelectItem key={modeOption} value={modeOption}>
                              {modeOption.charAt(0).toUpperCase() + modeOption.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Configuring...' : 'Configure Pin'}
                </Button>
              </form>
            </Form>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pin</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Signal</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Last Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devicePins.map((pin) => (
                      <TableRow key={pin.id}>
                        <TableCell>{pin.pinNumber}</TableCell>
                        <TableCell>{pin.name}</TableCell>
                        <TableCell>{pin.dataType}</TableCell>
                        <TableCell>{pin.signalType}</TableCell>
                        <TableCell>{pin.label || 'None'}</TableCell>
                        <TableCell className="capitalize">{pin.mode}</TableCell>
                        <TableCell>{pin.value !== undefined ? pin.value : 'No data'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeviceConfig;
