
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useHydro } from '@/contexts/HydroContext';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function DeviceCreate() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { createDevice, projects } = useHydro();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState('');

  useEffect(() => {
    if (projectId && projects) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setProjectName(project.name);
      }
    }
  }, [projectId, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectId) {
      console.error('No project ID provided');
      toast({
        title: "Error",
        description: "No project ID provided",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      const deviceId = await createDevice(name, description, projectId)
        .catch(error => {
          console.error('Error in createDevice:', error);
          toast({
            title: "Network Error",
            description: "Unable to connect to the server. Please try again later.",
            variant: "destructive"
          });
          return null;
        });
      
      if (deviceId) {
        navigate(`/projects/${projectId}/devices/${deviceId}`);
      }
    } catch (error) {
      console.error('Error creating device:', error);
      toast({
        title: "Error",
        description: "Failed to create device",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Button 
        variant="ghost" 
        onClick={() => navigate(`/projects/${projectId}`)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Project
      </Button>
      
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Add New Device</CardTitle>
          <CardDescription>
            Create a new device for your {projectName} project
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Device Name</Label>
              <Input 
                id="name" 
                placeholder="My Hydroponic Controller" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Device Description</Label>
              <Textarea 
                id="description" 
                placeholder="This device controls the main system..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/projects/${projectId}`)}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Device'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
