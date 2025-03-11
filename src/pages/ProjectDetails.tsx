
import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { PlusCircle, Pencil, ChevronLeft, Cpu, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHydro } from '@/contexts/HydroContext';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { toast } from "@/components/ui/use-toast";

const ProjectDetails = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, getDevicesByProject, updateProject, deleteProject } = useHydro();
  
  const project = projects.find(p => p.id === projectId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project?.name || '');
  const [editDescription, setEditDescription] = useState(project?.description || '');
  
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-600 mb-4">Project not found</p>
        <Button onClick={() => navigate('/projects')} variant="outline">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  const devices = getDevicesByProject(project.id);
  const connectedDevices = devices.filter(d => d.isConnected);
  
  const handleSaveEdit = () => {
    if (editName.trim() === '') {
      toast({
        title: "Error",
        description: "Project name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    updateProject(project.id, {
      name: editName,
      description: editDescription
    });
    
    setIsEditing(false);
    toast({
      title: "Project updated",
      description: "The project has been updated successfully",
    });
  };
  
  const handleDeleteProject = () => {
    deleteProject(project.id);
    toast({
      title: "Project deleted",
      description: "The project and all associated devices have been deleted",
    });
    navigate('/projects');
  };
  
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-2">
        <Button onClick={() => navigate('/projects')} variant="ghost" size="sm">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h2 className="text-3xl font-bold text-gray-800">{project.name}</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Name</h3>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Project name"
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Project description"
                      rows={4}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Description</h3>
                    <p className="text-gray-800 mt-1">{project.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Created</h3>
                    <p className="text-gray-800 mt-1">{new Date(project.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              {isEditing ? (
                <div className="flex space-x-2 w-full">
                  <Button variant="outline" className="w-full" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button className="w-full bg-hydro-blue hover:bg-blue-700" onClick={handleSaveEdit}>
                    Save Changes
                  </Button>
                </div>
              ) : (
                <div className="flex space-x-2 w-full">
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Project
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full sm:w-auto">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Project
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the project
                          "{project.name}" and all associated devices and data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteProject} className="bg-red-600 hover:bg-red-700">
                          Yes, delete project
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Devices</CardTitle>
              <Link to="/devices/create">
                <Button size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Device
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {devices.length === 0 ? (
                <div className="text-center py-8">
                  <Cpu className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No devices added to this project yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {devices.map(device => (
                    <div key={device.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className="ml-3">
                          <h4 className="font-medium text-gray-800">{device.name}</h4>
                          <p className="text-xs text-gray-500">
                            {device.description?.substring(0, 60)}{device.description && device.description.length > 60 ? '...' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={
                          device.isConnected 
                            ? "bg-green-50 text-green-600 border-green-200" 
                            : "bg-red-50 text-red-600 border-red-200"
                        }>
                          {device.isConnected ? 'Connected' : 'Offline'}
                        </Badge>
                        <Link to={`/devices/${device.id}/details`}>
                          <Button size="sm" variant="ghost">Details</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Devices</h3>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{devices.length}</p>
                </div>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Connected Devices</h3>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{connectedDevices.length}</p>
                </div>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                  <p className="text-gray-800 mt-1">
                    {devices.length > 0 && devices.some(d => d.lastSeen)
                      ? new Date(Math.max(...devices.filter(d => d.lastSeen).map(d => new Date(d.lastSeen!).getTime()))).toLocaleString()
                      : 'Never'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/devices/create">
                <Button variant="outline" className="w-full justify-start">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Device
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Project
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Project
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the project
                      "{project.name}" and all associated devices and data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteProject} className="bg-red-600 hover:bg-red-700">
                      Yes, delete project
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
