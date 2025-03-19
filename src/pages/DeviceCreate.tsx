
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

const DeviceCreate = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [deviceType, setDeviceType] = useState('esp32');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !projectId) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create the device without WiFi configuration initially
      const device = await createDevice(name, description, projectId, deviceType);
      toast.success('Device created successfully!');
      
      // Redirect to the WiFi setup page
      navigate(`/devices/${device.id}/wifi-setup`);
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
      
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 bg-hydro-blue text-white rounded-full flex items-center justify-center mb-1">
            1
          </div>
          <span className="text-xs text-gray-600 font-medium">Create Device</span>
        </div>
        <div className="h-0.5 flex-1 bg-gray-200 mx-2"></div>
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center mb-1">
            2
          </div>
          <span className="text-xs text-gray-500">Configure Wi-Fi</span>
        </div>
        <div className="h-0.5 flex-1 bg-gray-200 mx-2"></div>
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center mb-1">
            3
          </div>
          <span className="text-xs text-gray-500">Get Code</span>
        </div>
      </div>
      
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
                  After adding your device, you'll configure Wi-Fi and then receive the code to upload to your {deviceType.toUpperCase()}.
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
              disabled={isSubmitting}
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
