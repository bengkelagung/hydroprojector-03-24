import React, { useState, useEffect, useMemo } from 'react';
import { Pin, useHydro } from '@/contexts/HydroContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2, Save, X, History, LineChart, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
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
import { fetchPinHistory, PinHistoryEntry, formatPinHistoryForRecharts } from '@/utils/pin-history';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PinHistoryChart from '@/components/PinHistoryChart';

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
  const [pinValue, setPinValue] = useState<string>('0');
  const [pinHistory, setPinHistory] = useState<PinHistoryEntry[]>([]);
  const [historyTimeRange, setHistoryTimeRange] = useState<'hour' | 'day' | 'week' | 'month'>('day');
  const [activeTab, setActiveTab] = useState('details');
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  
  const device = pin ? devices.find(d => d.id === pin.deviceId) : null;
  const project = device ? projects.find(p => p.id === device.projectId) : null;
  
  useEffect(() => {
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
      setPinValue(pin.value || '0');
      
      if (activeTab === 'history') {
        loadPinHistory();
      }
    }
  }, [pin]);
  
  useEffect(() => {
    if (activeTab === 'history' && pin) {
      loadPinHistory();
    }
  }, [activeTab, historyTimeRange]);
  
  const loadPinHistory = async () => {
    if (!pin) return;
    
    setIsLoadingHistory(true);
    
    try {
      const history = await fetchPinHistory(pin.id, historyTimeRange);
      setPinHistory(history);
    } catch (error) {
      console.error('Error loading pin history:', error);
      toast.error('Error loading history data');
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
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
      
      if (tablesExist) {
        updates.label = editPinLabel || '';
      }
      
      await updatePin(pin.id, updates);
      
      toast.success(`Pin "${editPinName}" updated successfully`);
      
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
  
  const handleToggleOutput = async () => {
    if (!pin) return;
    
    try {
      const newValue = pinValue === '1' ? '0' : '1';
      setPinValue(newValue);
      
      await togglePinValue(pin.id);
      
      setTimeout(() => {
        loadPinHistory();
      }, 500);
      
      toast.success(`${pin.name} turned ${newValue === '1' ? 'on' : 'off'}`);
    } catch (error) {
      console.error('Error toggling pin value:', error);
      setPinValue(pinValue);
      toast.error('Failed to toggle pin');
    }
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
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  const chartData = useMemo(() => {
    const isDigital = pin?.dataType === 'digital' || pin?.dataType === 'boolean';
    return formatPinHistoryForRecharts(pinHistory, isDigital, pin?.name || 'Value');
  }, [pinHistory, pin?.dataType, pin?.name]);
  
  if (!pin) return null;
  
  const isOn = pinValue === '1' || pinValue.toLowerCase() === 'on' || pinValue.toLowerCase() === 'true';
  const colorClass = getSignalColor(pin.signalType);
  
  const isDigital = pin.dataType === 'digital' || pin.dataType === 'boolean';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center">
            <div className={`w-3 h-3 rounded-full ${colorClass} mr-2`}></div>
            Pin: {pin.name}
          </DialogTitle>
          <DialogDescription>
            View and manage pin configuration details
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details">
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
                          <SelectItem value="none">None</SelectItem>
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
            </TabsContent>
            
            <TabsContent value="history">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Pin Value History</h3>
                  <Select 
                    value={historyTimeRange} 
                    onValueChange={(value) => setHistoryTimeRange(value as 'hour' | 'day' | 'week' | 'month')}
                    disabled={isLoadingHistory}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hour">Last Hour</SelectItem>
                      <SelectItem value="day">Last Day</SelectItem>
                      <SelectItem value="week">Last Week</SelectItem>
                      <SelectItem value="month">Last Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-2 flex items-center justify-between">
                    <div className="flex items-center">
                      <LineChart className="h-4 w-4 mr-1" />
                      Data Visualization
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadPinHistory}
                      disabled={isLoadingHistory}
                      className="h-7 text-xs"
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                      {isLoadingHistory ? 'Loading...' : 'Refresh'}
                    </Button>
                  </h4>
                  <div className="border rounded-lg overflow-hidden p-2">
                    {isLoadingHistory ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <RefreshCw className="h-8 w-8 text-gray-300 mx-auto mb-2 animate-spin" />
                        <p className="text-gray-500">Loading chart data...</p>
                      </div>
                    ) : pinHistory.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <LineChart className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No chart data available</p>
                      </div>
                    ) : (
                      <PinHistoryChart 
                        historyData={chartData} 
                        dataKey={pin.name} 
                        isDigital={isDigital}
                        color={getSignalColor(pin.signalType).replace('bg-', 'text-')}
                      />
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <History className="h-4 w-4 mr-1" />
                    Data Records ({isLoadingHistory ? 'Loading...' : pinHistory.length} records)
                  </h4>
                  {isLoadingHistory ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <RefreshCw className="h-8 w-8 text-gray-300 mx-auto mb-2 animate-spin" />
                      <p className="text-gray-500">Loading history data...</p>
                    </div>
                  ) : pinHistory.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <History className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No history data available</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Changes to this pin will be recorded for future reference
                      </p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-3 bg-gray-100 text-xs font-medium text-gray-700 p-2">
                        <div className="col-span-2">Timestamp</div>
                        <div>Value</div>
                      </div>
                      <div className="max-h-[200px] overflow-y-auto">
                        {pinHistory.slice(0, 100).map((entry) => (
                          <div 
                            key={entry.id} 
                            className="grid grid-cols-3 text-sm p-2 border-t hover:bg-gray-50"
                          >
                            <div className="col-span-2">{formatTimestamp(entry.created_at)}</div>
                            <div className="font-medium">
                              {pin.mode === 'output' ? (
                                entry.value === '1' ? (
                                  <span className="text-green-600">ON</span>
                                ) : (
                                  <span className="text-gray-500">OFF</span>
                                )
                              ) : (
                                `${entry.value}${pin.unit || ''}`
                              )}
                            </div>
                          </div>
                        ))}
                        {pinHistory.length > 100 && (
                          <div className="p-2 text-center text-xs text-gray-500 border-t">
                            Showing 100 of {pinHistory.length} records
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
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
