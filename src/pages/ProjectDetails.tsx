
import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { PlusCircle, Pencil, ChevronLeft, Cpu } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHydro } from '@/contexts/HydroContext';
import { Separator } from '@/components/ui/separator';

const ProjectDetails = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, getDevicesByProject } = useHydro();
  
  const project = projects.find(p => p.id === projectId);
  
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
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button variant="outline" className="w-full sm:w-auto">
                <Pencil className="mr-2 h-4 w-4" />
                Edit Project
              </Button>
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
                            {device.description.substring(0, 60)}{device.description.length > 60 ? '...' : ''}
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
              <Button variant="outline" className="w-full justify-start">
                <Pencil className="mr-2 h-4 w-4" />
                Edit Project
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
