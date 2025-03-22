
import React from 'react';
import { Check, Wifi } from 'lucide-react';

interface WiFiCredentials {
  ssid: string;
  password: string;
}

interface WiFiCredentialsDisplayProps {
  credentials: WiFiCredentials | null;
}

/**
 * Component that displays the scanned WiFi credentials
 */
const WiFiCredentialsDisplay: React.FC<WiFiCredentialsDisplayProps> = ({
  credentials
}) => {
  if (!credentials) return null;

  return (
    <div className="space-y-4">
      <div className="p-4 bg-green-50 border border-green-200 rounded-md">
        <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
          <Check className="h-5 w-5 text-green-600" />
          <span>Wi-Fi configured successfully</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Wifi className="h-4 w-4 text-green-600" />
          <span>
            <strong>Network:</strong> {credentials.ssid}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-700 mt-1">
          <span>
            <strong>Password:</strong> {credentials.password}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WiFiCredentialsDisplay;
