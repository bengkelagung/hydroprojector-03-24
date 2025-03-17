
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Cpu, InfoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useHydro } from '@/contexts/HydroContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import QRCodeScanner from '@/components/QRCodeScanner';

const DeviceCreate = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [deviceType, setDeviceType] = useState('esp32');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wifiSSID, setWifiSSID] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [deviceConnected, setDeviceConnected] = useState(false);
  const { projects, createDevice } = useHydro();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we were redirected from project creation with a specific project
  useEffect(() => {
    if (location.state && location.state.projectId) {
      setProjectId(location.state.projectId);
    } else if (projects.length === 1) {
      // If there's only one project, select it by default
      setProjectId(projects[0].id);
    }
  }, [location.state, projects]);

  // Check for connected device (in a real app, this would query your device)
  useEffect(() => {
    // Simulate device detection - in real implementation, check if device is in pairing mode
    const checkDeviceConnection = async () => {
      try {
        // For real implementation, check for server availability
        const response = await fetch('http://localhost:3001/api/scan-wifi', { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          // Set a short timeout for the request
          signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
          setDeviceConnected(true);
        } else {
          setDeviceConnected(false);
        }
      } catch (error) {
        console.error('Error checking device connection:', error);
        setDeviceConnected(false);
      }
    };
    
    checkDeviceConnection();
  }, []);

  const handleWifiConnect = (ssid: string, password: string) => {
    setWifiSSID(ssid);
    setWifiPassword(password);
    toast.success(`Wi-Fi credentials saved: ${ssid}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !projectId) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (!wifiSSID) {
      toast.error('Please scan a Wi-Fi QR code first');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Add Wi-Fi configuration to the device details
      const wifiConfig = { wifiSSID, wifiPassword };
      
      const device = await createDevice(name, description, projectId, deviceType, wifiConfig);
      toast.success('Device created successfully!');
      navigate(`/devices/${device.id}/code`);
    } catch (error) {
      console.error('Error creating device:', error);
      toast.error('Failed to create device. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If no projects exist, prompt user to create one
  if (projects.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert className="mb-8 bg-amber-50 border-amber-200">
          <InfoIcon className="h-5 w-5 text-amber-500" />
          <AlertTitle className="text-amber-800">No projects found</AlertTitle>
          <AlertDescription className="text-amber-700">
            You need to create a project before adding a device.
          </AlertDescription>
        </Alert>
        
        <Button
          onClick={() => navigate('/projects/create')}
          className="bg-hydro-blue hover:bg-blue-700"
        >
          Create Your First Project
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Add a New Device</h1>
        <p className="text-gray-600 mt-2">
          Configure your ESP32 or other controller to connect with your hydroponics system.
        </p>
      </div>
      
      {/* QR Code Scanner Component */}
      <QRCodeScanner 
        onConnect={handleWifiConnect} 
        serverConnected={deviceConnected} 
      />
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Device Details</CardTitle>
            <CardDescription>
              Provide information about the device you're adding to your system
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="device-name">Device Name</Label>
              <Input
                id="device-name"
                placeholder="e.g., ESP32 Kangkung, Nutrient Controller, etc."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">
                Choose a descriptive name that helps identify this device's purpose.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select value={projectId} onValueChange={setProjectId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="device-type">Device Type</Label>
              <Select value={deviceType} onValueChange={setDeviceType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select device type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="esp32">ESP32</SelectItem>
                  <SelectItem value="esp8266">ESP8266</SelectItem>
                  <SelectItem value="arduino">Arduino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Display selected Wi-Fi if connected */}
            {wifiSSID && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h4 className="font-medium text-green-800">Wi-Fi Configured</h4>
                <p className="text-sm text-green-700">
                  Your device will connect to: <strong>{wifiSSID}</strong>
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="device-description">Description (Optional)</Label>
              <Textarea
                id="device-description"
                placeholder="What will this device control or monitor? Any special setup notes?"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start">
              <Cpu className="h-5 w-5 text-hydro-blue mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-hydro-blue">Next Steps</h4>
                <p className="text-sm text-gray-600 mt-1">
                  After adding your device, you'll receive the code to upload to your {deviceType.toUpperCase()}.
                  Wi-Fi credentials will be automatically configured from your QR code scan.
                </p>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-hydro-blue hover:bg-blue-700"
              disabled={isSubmitting || !wifiSSID}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Device...
                </>
              ) : (
                'Add Device'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default DeviceCreate;
