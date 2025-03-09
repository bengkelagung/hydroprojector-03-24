
import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Droplet, Cpu, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-hydro-green" />
            <span className="text-2xl font-bold text-gray-800">HydroProjekt</span>
          </div>
          <div className="space-x-4">
            <Link to="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 lg:pr-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
              Smart Hydroponics Management Made Easy
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              Create, connect, and control your ESP32-powered hydroponics system with our intuitive platform.
            </p>
            <div className="mt-8 space-x-4">
              <Link to="/register">
                <Button size="lg" className="bg-hydro-blue hover:bg-blue-700">
                  Get Started
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">
                  Login
                </Button>
              </Link>
            </div>
          </div>
          <div className="lg:w-1/2 mt-10 lg:mt-0">
            <div className="relative bg-white rounded-xl shadow-xl p-6 overflow-hidden">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-hydro-light-blue rounded-lg p-4 flex items-center">
                  <Droplet className="h-8 w-8 text-hydro-blue mr-3" />
                  <div>
                    <h3 className="font-semibold">Monitor</h3>
                    <p className="text-sm text-gray-600">pH, nutrients, temperature</p>
                  </div>
                </div>
                <div className="bg-hydro-light-green rounded-lg p-4 flex items-center">
                  <Cpu className="h-8 w-8 text-hydro-green mr-3" />
                  <div>
                    <h3 className="font-semibold">Connect</h3>
                    <p className="text-sm text-gray-600">ESP32 devices easily</p>
                  </div>
                </div>
                <div className="bg-amber-100 rounded-lg p-4 flex items-center">
                  <Leaf className="h-8 w-8 text-amber-600 mr-3" />
                  <div>
                    <h3 className="font-semibold">Grow</h3>
                    <p className="text-sm text-gray-600">Optimize plant growth</p>
                  </div>
                </div>
                <div className="bg-purple-100 rounded-lg p-4 flex items-center">
                  <LayoutDashboard className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <h3 className="font-semibold">Analyze</h3>
                    <p className="text-sm text-gray-600">Track performance</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-hydro-blue opacity-10 rounded-full"></div>
              <div className="absolute -top-12 -left-12 w-40 h-40 bg-hydro-green opacity-10 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white rounded-xl shadow-md">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Key Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-blue-50 rounded-lg border border-blue-100">
            <Cpu className="h-10 w-10 text-hydro-blue mb-4" />
            <h3 className="text-xl font-semibold mb-2">ESP32 Integration</h3>
            <p className="text-gray-600">
              Easily connect and configure ESP32 devices with auto-generated code for your hydroponics system.
            </p>
          </div>
          
          <div className="p-6 bg-green-50 rounded-lg border border-green-100">
            <Droplet className="h-10 w-10 text-hydro-green mb-4" />
            <h3 className="text-xl font-semibold mb-2">Dynamic Pin Configuration</h3>
            <p className="text-gray-600">
              Configure any ESP32 pin for various sensors like pH, temperature, water level, and more.
            </p>
          </div>
          
          <div className="p-6 bg-amber-50 rounded-lg border border-amber-100">
            <LayoutDashboard className="h-10 w-10 text-amber-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Real-time Dashboard</h3>
            <p className="text-gray-600">
              Monitor all your hydroponics projects in one place with real-time data visualization.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 py-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2">
              <Leaf className="h-6 w-6 text-hydro-light-green" />
              <span className="text-xl font-bold">HydroProjekt</span>
            </div>
            <div className="mt-4 md:mt-0">
              <p className="text-gray-400">© 2023 HydroProjekt. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
