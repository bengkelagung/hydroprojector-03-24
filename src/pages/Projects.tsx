
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useHydro } from '@/contexts/HydroContext';

const Projects = () => {
  const { projects, getDevicesByProject } = useHydro();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Projects</h2>
        <Link to="/projects/create">
          <Button className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">No projects yet</p>
          <Link to="/projects/create">
            <Button className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
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
              <Card key={project.id} className="overflow-hidden">
                <CardHeader className="bg-hydro-blue text-white pb-4">
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <p className="text-sm text-blue-100">
                    Created on {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-700 mb-4">
                    {project.description || project.name}
                  </p>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Connected Devices</span>
                      <span>{connectedCount}/{deviceCount}</span>
                    </div>
                    <Progress 
                      value={(connectedCount / Math.max(deviceCount, 1)) * 100} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
                <CardFooter className="border-t flex justify-between py-4">
                  <Link to={`/devices/create?projectId=${project.id}`}>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Plus className="h-4 w-4" />
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
