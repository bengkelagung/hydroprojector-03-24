
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus } from 'lucide-react';
import { useHydro } from '@/contexts/HydroContext';

const Dashboard = () => {
  const { projects, devices, pins } = useHydro();

  // Calculate the number of devices per project
  const projectDevices: { [projectId: string]: any[] } = {};
  devices.forEach(device => {
    if (!projectDevices[device.projectId]) {
      projectDevices[device.projectId] = [];
    }
    projectDevices[device.projectId].push(device);
  });

  // Calculate connected devices per project
  const getConnectedDevices = (projectId: string) => {
    return projectDevices[projectId]?.filter(device => device.isConnected).length || 0;
  };

  // Function to render project cards 
  const renderProjectCards = () => {
    if (!projects || projects.length === 0) {
      return <p>No projects created yet.</p>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const deviceCount = projectDevices[project.id]?.length || 0;
          const connectedCount = getConnectedDevices(project.id);
          
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
    );
  };

  // Get project name by projectId
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  // Function to render device cards
  const renderDeviceCards = () => {
    if (!devices || devices.length === 0) {
      return <p>No devices added yet.</p>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <Card key={device.id} className="overflow-hidden">
            <CardHeader className="bg-hydro-blue text-white pb-4">
              <CardTitle className="text-xl">{device.name}</CardTitle>
              <p className="text-sm text-blue-100">
                Project: {getProjectName(device.projectId)}
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-700 mb-4">
                {device.description || device.name}
              </p>
              <div className="text-sm">
                <span className={`px-2 py-1 rounded-full ${device.isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {device.isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </CardContent>
            <CardFooter className="border-t flex justify-between py-4">
              <Link to={`/devices/${device.id}/config`}>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </Link>
              <Link to={`/devices/${device.id}/details`}>
                <Button variant="ghost" size="sm">View Details</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  // Get device name by deviceId
  const getDeviceName = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    return device ? device.name : 'Unknown Device';
  };

  // Function to render sensor cards
  const renderSensorCards = () => {
    if (!pins || pins.length === 0) {
      return <p>No sensors configured yet.</p>;
    }

    // Only display input pins as sensors
    const sensorPins = pins.filter(pin => pin.mode === 'input');

    if (sensorPins.length === 0) {
      return <p>No sensors configured yet.</p>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sensorPins.map((pin) => {
          const device = devices.find(d => d.id === pin.deviceId);
          const project = device ? projects.find(p => p.id === device.projectId) : null;
          
          // Generate mock value for demo purposes if none exists
          let mockValue;
          switch (pin.signalType) {
            case 'pH':
              mockValue = (5.5 + Math.random() * 2).toFixed(1);
              break;
            case 'temperature':
              mockValue = (20 + Math.random() * 8).toFixed(1);
              break;
            case 'humidity':
              mockValue = (50 + Math.random() * 30).toFixed(1);
              break;
            case 'water-level':
              mockValue = (70 + Math.random() * 30).toFixed(1);
              break;
            default:
              mockValue = Math.floor(Math.random() * 100).toString();
          }
          
          const value = pin.value || mockValue;
          
          return (
            <Card key={pin.id} className="overflow-hidden">
              <CardHeader className="bg-hydro-blue text-white pb-4">
                <CardTitle className="text-xl">{pin.name}</CardTitle>
                <p className="text-sm text-blue-100">
                  Device: {getDeviceName(pin.deviceId)}
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-700">Type: {pin.signalType}</span>
                  <span className="text-xl font-bold">{value}{pin.unit}</span>
                </div>
                <div>
                  {pin.signalType === 'water-level' && (
                    <Progress 
                      value={parseFloat(value)} 
                      className="h-2 bg-gray-200"
                    />
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t flex justify-between py-4">
                <Link to={`/devices/${pin.deviceId}/details`}>
                  <Button variant="ghost" size="sm">View Details</Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Hello, user</h1>
        <div className="flex gap-2">
          <Link to="/projects/create">
            <Button className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
          <Link to="/devices/create">
            <Button className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              Add Device
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
        <div className="flex space-x-8 border-b mb-6">
          <button className="py-3 border-b-2 border-hydro-blue font-medium text-hydro-blue">Projects</button>
          <button className="py-3 text-gray-500">Devices</button>
          <button className="py-3 text-gray-500">Sensor Readings</button>
        </div>

        {renderProjectCards()}
      </div>
    </div>
  );
};

export default Dashboard;
