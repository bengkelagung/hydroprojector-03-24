
import React from 'react';
import { Check } from 'lucide-react';

const DeviceSetupProgress: React.FC = () => {
  return (
    <div className="flex items-center justify-between mb-6 px-2">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 bg-hydro-blue text-white rounded-full flex items-center justify-center mb-1">
          <Check className="h-5 w-5" />
        </div>
        <span className="text-xs text-gray-600">Create Device</span>
      </div>
      <div className="h-0.5 flex-1 bg-hydro-blue mx-2"></div>
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 bg-hydro-blue text-white rounded-full flex items-center justify-center mb-1">
          <Check className="h-5 w-5" />
        </div>
        <span className="text-xs text-gray-600">Configure Wi-Fi</span>
      </div>
      <div className="h-0.5 flex-1 bg-hydro-blue mx-2"></div>
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 bg-hydro-blue text-white rounded-full flex items-center justify-center mb-1">
          3
        </div>
        <span className="text-xs text-gray-600 font-medium">Get Code</span>
      </div>
    </div>
  );
};

export default DeviceSetupProgress;
