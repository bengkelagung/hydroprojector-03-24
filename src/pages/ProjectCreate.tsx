
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useHydro } from '@/contexts/HydroContext';

const ProjectCreate = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createProject } = useHydro();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast.error('Please provide a project name');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const project = await createProject(name, description);
      toast.success('Project created successfully!');
      navigate('/devices/create', { state: { projectId: project.id } });
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Create a New Project</h1>
        <p className="text-gray-600 mt-2">
          Set up your hydroponics project to start monitoring and controlling your system.
        </p>
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Provide the basic information about your hydroponics setup
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="e.g., Balcony Hydroponics, Kitchen Herbs, etc."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project-description">Description (Optional)</Label>
              <Textarea
                id="project-description"
                placeholder="Describe your project, goals, or any special notes..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start">
              <Leaf className="h-5 w-5 text-hydro-blue mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-hydro-blue">Next Steps</h4>
                <p className="text-sm text-gray-600 mt-1">
                  After creating your project, you'll be able to add devices like ESP32 controllers
                  and configure sensors for monitoring your hydroponics system.
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
              className="bg-hydro-green hover:bg-green-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ProjectCreate;
