
import React from 'react';
import { Outlet } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import ConnectionStatus from './ConnectionStatus';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = () => {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <main className="p-4 md:p-6">
          <ConnectionStatus />
          <Outlet />
        </main>
        <Toaster />
      </div>
    </ErrorBoundary>
  );
};

export default Layout;
