
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useHydro } from '@/contexts/HydroContext';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function ProjectCreate() {
  const navigate = useNavigate();
  const { createProject } = useHydro();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const projectId = await createProject(name, description)
        .catch(error => {
          console.error('Error in createProject:', error);
          toast({
            title: "Network Error",
            description: "Unable to connect to the server. Please try again later.",
            variant: "destructive"
          });
          return null;
        });
      
      if (projectId) {
        navigate(`/projects/${projectId}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
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
        onClick={() => navigate('/projects')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Projects
      </Button>
      
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Create New Project</CardTitle>
          <CardDescription>
            Create a new hydroponic project to organize your devices and data
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input 
                id="name" 
                placeholder="My Hydroponic Project" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea 
                id="description" 
                placeholder="This project is for my indoor herb garden..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/projects')}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
