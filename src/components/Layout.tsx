
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Leaf, Cpu, Sliders, LogOut, Menu, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/dashboard' },
    { name: 'Create Project', icon: <PlusCircle className="w-5 h-5" />, path: '/projects/create' },
    { name: 'Add Device', icon: <Cpu className="w-5 h-5" />, path: '/devices/create' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md transition-transform duration-300 ease-in-out transform lg:translate-x-0 lg:static lg:inset-auto lg:w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-5 border-b">
            <div className="flex items-center space-x-2">
              <Leaf className="w-8 h-8 text-hydro-green" />
              <span className="text-xl font-bold tracking-wide text-gray-800">HydroProjekt</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden" 
              onClick={() => setSidebarOpen(false)}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>

          {/* Sidebar navigation */}
          <nav className="flex-1 px-3 py-4 bg-white space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                  location.pathname === item.path
                    ? "bg-hydro-light-blue text-hydro-blue"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Sidebar footer */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="ml-3">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="bg-white shadow-sm z-10">
          <div className="px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
            <Button
              variant="ghost"
              size="icon"
              className={cn("lg:hidden", sidebarOpen && "hidden")}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-800">
              {location.pathname === '/dashboard' && 'Dashboard'}
              {location.pathname === '/projects/create' && 'Create Project'}
              {location.pathname === '/devices/create' && 'Add Device'}
              {location.pathname.includes('/devices/') && location.pathname.includes('/code') && 'Device Code'}
              {location.pathname.includes('/devices/') && location.pathname.includes('/config') && 'Configure Device'}
            </h1>
            <div>{/* Right side of navbar if needed */}</div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
