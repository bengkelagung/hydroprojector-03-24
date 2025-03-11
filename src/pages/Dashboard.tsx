
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  // Calculate the number of sensors per device
  const deviceSensors: { [deviceId: string]: any[] } = {};
  pins.forEach(pin => {
    if (!deviceSensors[pin.deviceId]) {
      deviceSensors[pin.deviceId] = [];
    }
    deviceSensors[pin.deviceId].push(pin);
  });

  // Function to get the total number of sensors for a project
  const getProjectSensors = (projectId: string) => {
    let count = 0;
    devices.filter(device => device.projectId === projectId).forEach(device => {
      count += deviceSensors[device.id]?.length || 0;
    });
    return count;
  };

  // Function to render project cards 
  const renderProjectCards = () => {
    if (!projects || projects.length === 0) {
      return <p>No projects created yet.</p>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.slice(0, 3).map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <CardTitle>{project.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {project.description?.substring(0, 100) || "No description provided."}
                {project.description && project.description.length > 100 ? "..." : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-slate-100">
                  {projectDevices[project.id]?.length || 0} Devices
                </Badge>
                <Badge variant="outline" className="bg-slate-100">
                  {getProjectSensors(project.id)} Sensors
                </Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Link to={`/projects/${project.id}/details`} className="w-full">
                <Button className="w-full" variant="outline">View Details</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  // Function to render device cards
  const renderDeviceCards = () => {
    if (!devices || devices.length === 0) {
      return <p>No devices added yet.</p>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.slice(0, 3).map((device) => {
          const project = projects.find(p => p.id === device.projectId);

          return (
            <Card key={device.id} className="hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {device.name}
                  <Badge variant={device.isConnected ? "default" : "outline"} className={
                    device.isConnected ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-red-100 text-red-800 hover:bg-red-200"
                  }>
                    {device.isConnected ? "Online" : "Offline"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {device.description?.substring(0, 100) || "No description provided."}
                  {device.description && device.description.length > 100 ? "..." : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project && (
                    <Badge variant="outline" className="bg-slate-100">
                      Project: {project.name}
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-slate-100">
                    {deviceSensors[device.id]?.length || 0} Sensors
                  </Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Link to={`/devices/${device.id}/details`} className="w-full">
                  <Button className="w-full" variant="outline">View Details</Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  };

  // Function to render sensor cards
  const renderSensorCards = () => {
    if (!pins || pins.length === 0) {
      return <p>No sensors configured yet.</p>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pins.slice(0, 3).map((pin) => {
          const device = devices.find(d => d.id === pin.deviceId);
          
          return (
            <Card key={pin.id} className="hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <CardTitle>{pin.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Sensor Type: {pin.signalType}
                </p>
                {device && (
                  <Badge variant="outline" className="bg-slate-100">
                    Device: {device.name}
                  </Badge>
                )}
              </CardContent>
              <CardFooter>
                <Link to={`/devices/${device?.id}/details`} className="w-full">
                  <Button className="w-full" variant="outline">View Details</Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Projects</h2>
          <Link to="/projects" className="text-blue-500 hover:underline">
            View All
          </Link>
        </div>
        {renderProjectCards()}
      </section>

      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Devices</h2>
          <Link to="/devices" className="text-blue-500 hover:underline">
            View All
          </Link>
        </div>
        {renderDeviceCards()}
      </section>

      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Sensors</h2>
          <Link to="/readings" className="text-blue-500 hover:underline">
            View All
          </Link>
        </div>
        {renderSensorCards()}
      </section>
    </div>
  );
};

export default Dashboard;
