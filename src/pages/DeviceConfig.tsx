import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useHydro } from "@/contexts/HydroContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { checkTablesExist } from "@/integrations/supabase/client";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

type PinConfigFormValues = {
  pinId: string;
  name: string;
  dataType: string;
  signalType: string;
  label: string;
  mode: "input" | "output";
};

type AlertThresholdFormValues = {
  ph_min: number;
  ph_max: number;
  temp_min: number;
  temp_max: number;
  humidity_min: number;
  humidity_max: number;
  water_level_min: number;
};

type TelegramConfigFormValues = {
  chatId: string;
  enableNotifications: boolean;
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
    fetchLabels,
  } = useHydro();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tablesExist, setTablesExist] = useState<boolean>(false);
  const [availablePins, setAvailablePins] = useState<
    { id: string; name: string; pinNumber: number }[]
  >([]);
  const [activeTab, setActiveTab] = useState("pin-config");

  const device = devices.find((d) => d.id === deviceId);
  const devicePins = getPinsByDevice(deviceId || "");

  const form = useForm<PinConfigFormValues>({
    defaultValues: {
      pinId: "",
      name: "",
      dataType: "",
      signalType: "",
      label: "",
      mode: "input",
    },
  });

  const alertForm = useForm<AlertThresholdFormValues>({
    defaultValues: {
      ph_min: 5.5,
      ph_max: 7.5,
      temp_min: 18,
      temp_max: 28,
      humidity_min: 40,
      humidity_max: 90,
      water_level_min: 40,
    },
  });

  const telegramForm = useForm<TelegramConfigFormValues>({
    defaultValues: {
      chatId: "",
      enableNotifications: true,
    },
  });

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  useEffect(() => {
    const checkTables = async () => {
      const exist = await checkTablesExist();
      setTablesExist(exist);
    };

    checkTables();
  }, []);

  // Filter pin options to only show unused pins
  useEffect(() => {
    if (!deviceId) return;

    // Get all used pin numbers for this device
    const usedPinNumbers = new Set(devicePins.map((pin) => pin.pinNumber));

    // Filter out used pins from pin options
    const filteredPins = pinOptions.filter(
      (pin) => !usedPinNumbers.has(pin.pinNumber),
    );

    setAvailablePins(filteredPins);
  }, [deviceId, devicePins, pinOptions]);

  const onSubmit = async (values: PinConfigFormValues) => {
    if (!deviceId) {
      toast.error("Device ID is missing");
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
        values.label === "none" ? "" : values.label,
      );

      form.reset({
        pinId: "",
        name: "",
        dataType: "",
        signalType: "",
        label: "",
        mode: "input",
      });

      toast.success("Pin configured successfully");
    } catch (error) {
      console.error("Error configuring pin:", error);
      toast.error("Failed to configure pin");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onAlertThresholdSubmit = async (values: AlertThresholdFormValues) => {
    try {
      // In a real implementation, you would save these values to your database
      // For now, we'll just show a success message
      console.log("Alert thresholds:", values);
      toast.success("Alert thresholds updated successfully");
    } catch (error) {
      console.error("Error updating alert thresholds:", error);
      toast.error("Failed to update alert thresholds");
    }
  };

  const onTelegramConfigSubmit = async (values: TelegramConfigFormValues) => {
    try {
      // In a real implementation, you would save these values to your database
      // For now, we'll just show a success message
      console.log("Telegram config:", values);
      toast.success("Telegram notifications configured successfully");
    } catch (error) {
      console.error("Error configuring Telegram notifications:", error);
      toast.error("Failed to configure Telegram notifications");
    }
  };

  if (!device) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Device not found</h1>
        <Button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
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
        <Button onClick={() => navigate(`/devices/${deviceId}/code`)}>
          View Device Code
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="pin-config">Pin Configuration</TabsTrigger>
          <TabsTrigger value="alert-thresholds">Alert Thresholds</TabsTrigger>
          <TabsTrigger value="telegram-config">
            Telegram Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pin-config" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Configure New Pin</CardTitle>
                <CardDescription>
                  Set up a new pin for your device
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
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
                              {availablePins.length === 0 ? (
                                <SelectItem value="none" disabled>
                                  No available pins
                                </SelectItem>
                              ) : (
                                availablePins.map((pin) => (
                                  <SelectItem key={pin.id} value={pin.id}>
                                    {pin.name} (Pin {pin.pinNumber})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Only unused pins are shown in this list
                          </FormDescription>
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
                                <SelectItem
                                  key={labelOption}
                                  value={labelOption}
                                >
                                  {labelOption}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Label determines how this pin will be displayed in
                            the dashboard
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
                            onValueChange={
                              field.onChange as (value: string) => void
                            }
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
                                  {modeOption.charAt(0).toUpperCase() +
                                    modeOption.slice(1)}
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
                      disabled={isSubmitting || availablePins.length === 0}
                    >
                      {isSubmitting ? "Configuring..." : "Configure Pin"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Configured Pins</CardTitle>
                <CardDescription>
                  Currently configured pins for this device
                </CardDescription>
              </CardHeader>
              <CardContent>
                {devicePins.length === 0 ? (
                  <p className="text-muted-foreground">
                    No pins configured yet.
                  </p>
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
                            <TableCell>{pin.label || "None"}</TableCell>
                            <TableCell className="capitalize">
                              {pin.mode}
                            </TableCell>
                            <TableCell>
                              {pin.value !== undefined ? pin.value : "No data"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alert-thresholds" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Thresholds</CardTitle>
              <CardDescription>
                Configure when to send alerts via Telegram
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...alertForm}>
                <form
                  onSubmit={alertForm.handleSubmit(onAlertThresholdSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">pH Thresholds</h3>
                      <FormField
                        control={alertForm.control}
                        name="ph_min"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum pH: {field.value}</FormLabel>
                            <FormControl>
                              <Slider
                                min={0}
                                max={14}
                                step={0.1}
                                value={[field.value]}
                                onValueChange={(value) =>
                                  field.onChange(value[0])
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Alert when pH falls below this value
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={alertForm.control}
                        name="ph_max"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum pH: {field.value}</FormLabel>
                            <FormControl>
                              <Slider
                                min={0}
                                max={14}
                                step={0.1}
                                value={[field.value]}
                                onValueChange={(value) =>
                                  field.onChange(value[0])
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Alert when pH rises above this value
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">
                        Temperature Thresholds
                      </h3>
                      <FormField
                        control={alertForm.control}
                        name="temp_min"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Minimum Temperature: {field.value}°C
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={0}
                                max={40}
                                step={0.5}
                                value={[field.value]}
                                onValueChange={(value) =>
                                  field.onChange(value[0])
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Alert when temperature falls below this value
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={alertForm.control}
                        name="temp_max"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Maximum Temperature: {field.value}°C
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={0}
                                max={40}
                                step={0.5}
                                value={[field.value]}
                                onValueChange={(value) =>
                                  field.onChange(value[0])
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Alert when temperature rises above this value
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">
                        Humidity Thresholds
                      </h3>
                      <FormField
                        control={alertForm.control}
                        name="humidity_min"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Minimum Humidity: {field.value}%
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) =>
                                  field.onChange(value[0])
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Alert when humidity falls below this value
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={alertForm.control}
                        name="humidity_max"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Maximum Humidity: {field.value}%
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) =>
                                  field.onChange(value[0])
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Alert when humidity rises above this value
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">
                        Water Level Threshold
                      </h3>
                      <FormField
                        control={alertForm.control}
                        name="water_level_min"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Minimum Water Level: {field.value}%
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) =>
                                  field.onChange(value[0])
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Alert when water level falls below this value
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full md:w-auto">
                    Save Alert Thresholds
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="telegram-config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Telegram Notifications</CardTitle>
              <CardDescription>
                Configure Telegram notifications for this device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...telegramForm}>
                <form
                  onSubmit={telegramForm.handleSubmit(onTelegramConfigSubmit)}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                      <h3 className="text-blue-800 font-medium mb-2">
                        How to get your Telegram Chat ID
                      </h3>
                      <ol className="list-decimal list-inside text-blue-700 space-y-2">
                        <li>Open Telegram and search for "@userinfobot"</li>
                        <li>Start a chat with this bot</li>
                        <li>The bot will reply with your Chat ID</li>
                        <li>Copy the ID (it's a number) and paste it below</li>
                      </ol>
                    </div>

                    <FormField
                      control={telegramForm.control}
                      name="chatId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telegram Chat ID</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 123456789" {...field} />
                          </FormControl>
                          <FormDescription>
                            Your Telegram Chat ID to receive notifications
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={telegramForm.control}
                      name="enableNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Enable Telegram Notifications
                            </FormLabel>
                            <FormDescription>
                              Receive alerts when sensor values exceed
                              thresholds
                            </FormDescription>
                          </div>
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full md:w-auto">
                    Save Telegram Configuration
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeviceConfig;
