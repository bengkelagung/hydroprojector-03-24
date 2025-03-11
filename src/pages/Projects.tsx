
import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHydro } from '@/contexts/HydroContext';
import { Progress } from '@/components/ui/progress';

const Projects = () => {
  const { projects, getDevicesByProject } = useHydro();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-bold text-gray-800">Projects</h2>
        <div className="mt-4 sm:mt-0">
          <Link to="/projects/create">
            <Button className="bg-hydro-blue hover:bg-blue-700">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">No projects yet</p>
          <Link to="/projects/create">
            <Button className="bg-hydro-blue hover:bg-blue-700">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Project
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const projectDevices = getDevicesByProject(project.id);
            const deviceCount = projectDevices.length;
            const connectedCount = projectDevices.filter(d => d.isConnected).length;
            
            return (
              <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-hydro-blue to-hydro-water pb-6">
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-white/80 text-hydro-blue">
                      {deviceCount} {deviceCount === 1 ? 'Device' : 'Devices'}
                    </Badge>
                  </div>
                  <CardTitle className="text-white">{project.name}</CardTitle>
                  <CardDescription className="text-blue-100">
                    Created on {new Date(project.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-600 mb-4">{project.description}</p>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Connected Devices</span>
                        <span className="font-medium">{connectedCount}/{deviceCount}</span>
                      </div>
                      <Progress value={(connectedCount / Math.max(deviceCount, 1)) * 100} />
                    </div>
                    
                    {deviceCount === 0 && (
                      <div className="text-sm text-gray-500 italic">
                        No devices added to this project yet
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between">
                  <Link to="/devices/create">
                    <Button variant="outline" size="sm">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Device
                    </Button>
                  </Link>
                  <Link to={`/projects/${project.id}/details`}>
                    <Button variant="ghost" size="sm">View Details</Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Projects;
