
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useHydro } from '@/contexts/HydroContext';

const Devices = () => {
  const { devices, projects, getPinsByDevice } = useHydro();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Devices</h2>
        <Link to="/devices/create">
          <Button className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            New Device
          </Button>
        </Link>
      </div>

      {devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">No devices yet</p>
          <Link to="/devices/create">
            <Button className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              Add Your First Device
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => {
            const project = projects.find(p => p.id === device.projectId);
            
            return (
              <Card key={device.id} className="overflow-hidden">
                <CardHeader className="bg-hydro-blue text-white pb-4">
                  <CardTitle className="text-xl">{device.name}</CardTitle>
                  <p className="text-sm text-blue-100">
                    Project: {project?.name || 'Unknown'}
                  </p>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-700 mb-4">
                    {device.description || device.name}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm">Status</span>
                    <span className={`px-2 py-1 rounded-full text-sm ${device.isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Devices;
