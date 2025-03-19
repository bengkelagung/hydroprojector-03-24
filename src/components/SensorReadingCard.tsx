
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pin } from '@/contexts/HydroContext';

interface SensorReadingCardProps {
  pin: Pin;
  deviceName?: string;
  projectName?: string;
  onToggle?: (pinId: string) => Promise<void>;
  onViewDetails?: (pin: Pin) => void;
  colorClass: string;
  icon: React.ReactNode;
}

const SensorReadingCard: React.FC<SensorReadingCardProps> = ({
  pin,
  deviceName,
  projectName,
  onToggle,
  onViewDetails,
  colorClass,
  icon
}) => {
  // Get the appropriate unit based on pin type
  const getUnit = () => {
    const label = pin.label?.toLowerCase() || '';
    const signalType = pin.signalType;
    
    if (label === 'suhu' || signalType === 'temperature') {
      return '°C';
    }
    
    if (label === 'kelembaban' || label === 'level air' || signalType === 'humidity' || signalType === 'water-level') {
      return '%';
    }
    
    if (label === 'lampu' || label === 'pompa') {
      return '';
    }
    
    return pin.unit || '';
  };

  // Format the display value based on pin type
  const getDisplayValue = () => {
    const value = pin.value || '0';
    const label = pin.label?.toLowerCase() || '';
    
    if (label === 'lampu' || label === 'pompa' || pin.mode === 'output') {
      return value === '1' || value.toLowerCase() === 'on' || value.toLowerCase() === 'true' ? 'ON' : 'OFF';
    }
    
    return `${value}${getUnit()}`;
  };

  // Helper to get alert status based on pin type and value
  const getAlertStatus = () => {
    const value = pin.value || '0';
    const label = pin.label?.toLowerCase() || '';
    const signalType = pin.signalType;
    
    if (label === 'ph' || signalType === 'pH') {
      return parseFloat(value) < 5.5 || parseFloat(value) > 7.5;
    }
    
    if (label === 'suhu' || signalType === 'temperature') {
      return parseFloat(value) < 18 || parseFloat(value) > 28;
    }
    
    if (label === 'kelembaban' || signalType === 'humidity') {
      return parseFloat(value) < 40 || parseFloat(value) > 90;
    }
    
    if (label === 'level air' || signalType === 'water-level') {
      return parseFloat(value) < 40;
    }
    
    return false;
  };
  
  // Get visual indicator component based on pin type and value
  const getVisualIndicator = () => {
    const value = pin.value || '0';
    const label = pin.label?.toLowerCase() || '';
    const signalType = pin.signalType;
    
    // pH indicator
    if (label === 'ph' || signalType === 'pH') {
      return (
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${parseFloat(value) < 6 ? 'bg-red-500' : parseFloat(value) > 7 ? 'bg-purple-500' : 'bg-green-500'}`} 
            style={{ width: `${(parseFloat(value) / 14) * 100}%` }}
          ></div>
        </div>
      );
    }
    
    // Temperature indicator
    if (label === 'suhu' || signalType === 'temperature') {
      return (
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${parseFloat(value) < 18 ? 'bg-blue-500' : parseFloat(value) > 28 ? 'bg-red-500' : 'bg-green-500'}`} 
            style={{ width: `${(parseFloat(value) / 40) * 100}%` }}
          ></div>
        </div>
      );
    }
    
    // Humidity, Water Level indicators
    if (label === 'kelembaban' || label === 'level air' || signalType === 'humidity' || signalType === 'water-level') {
      return (
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${parseFloat(value) < 30 ? 'bg-red-500' : parseFloat(value) < 60 ? 'bg-amber-500' : 'bg-green-500'}`} 
            style={{ width: `${parseFloat(value)}%` }}
          ></div>
        </div>
      );
    }
    
    // For on/off types (like Lampu/light or Pompa/pump)
    if (label === 'lampu' || label === 'pompa' || signalType === 'light' || signalType === 'digital' || pin.mode === 'output') {
      const isOn = value === '1' || value.toLowerCase() === 'on' || value.toLowerCase() === 'true';
      return (
        <div className="w-16 h-8 relative rounded-full bg-gray-200">
          <div className={`absolute inset-0 rounded-full transition-colors ${isOn ? 'bg-green-500' : 'bg-gray-400'}`}>
            <div className={`absolute w-6 h-6 bg-white rounded-full shadow transition-transform ${isOn ? 'translate-x-8' : 'translate-x-1'} top-1`} />
          </div>
        </div>
      );
    }
    
    // Default indicator for other types
    return (
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500" 
          style={{ width: `${(parseFloat(value) / 100) * 100}%` }}
        ></div>
      </div>
    );
  };

  const isOutput = pin.mode === 'output';
  const isOn = pin.value === '1' || (pin.value || '').toLowerCase() === 'on' || (pin.value || '').toLowerCase() === 'true';
  const alert = getAlertStatus();
  
  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onViewDetails && onViewDetails(pin)}
    >
      <div className={`p-4 ${colorClass.replace('bg-', 'bg-opacity-10 bg-')}`}>
        <div className="flex items-center">
          {icon}
          <h3 className="font-medium capitalize text-gray-800">{pin.name}</h3>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-medium text-gray-700">
                {pin.label || pin.signalType.charAt(0).toUpperCase() + pin.signalType.slice(1)}
              </h4>
              {deviceName && (
                <p className="text-xs text-gray-500">
                  {deviceName}{projectName && ` • ${projectName}`}
                </p>
              )}
            </div>
            <div className="flex items-center">
              {!isOutput && alert && (
                <AlertTriangle className="h-4 w-4 text-amber-500 mr-1.5" />
              )}
              {isOutput ? (
                <Badge variant={isOn ? "default" : "outline"} className={isOn ? "bg-green-600" : ""}>
                  {isOn ? "ON" : "OFF"}
                </Badge>
              ) : (
                <span className={`text-lg font-semibold ${alert ? 'text-amber-500' : 'text-gray-800'}`}>
                  {getDisplayValue()}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            {getVisualIndicator()}
            
            {isOutput && onToggle && (
              <Button
                variant={isOn ? "destructive" : "default"}
                size="sm"
                className="ml-3"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(pin.id);
                }}
              >
                <Power className="h-4 w-4 mr-1" />
                {isOn ? 'Turn Off' : 'Turn On'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SensorReadingCard;
