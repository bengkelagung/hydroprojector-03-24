
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
    <div className="min-h-screen bg-background">
      <main className="p-4 md:p-6">
        <ErrorBoundary>
          <ConnectionStatus />
          <Outlet />
        </ErrorBoundary>
      </main>
      <Toaster />
    </div>
  );
};

export default Layout;
