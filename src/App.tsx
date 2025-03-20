import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { HydroProvider } from "./contexts/HydroContext";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProjectCreate from "./pages/ProjectCreate";
import DeviceCreate from "./pages/DeviceCreate";
import DeviceConfig from "./pages/DeviceConfig";
import DeviceCode from "./pages/DeviceCode";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import Projects from "./pages/Projects";
import Devices from "./pages/Devices";
import Readings from "./pages/Readings";
import ProjectDetails from "./pages/ProjectDetails";
import DeviceDetails from "./pages/DeviceDetails";
import DeviceWifiSetup from "./pages/DeviceWifiSetup";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  const { user } = useAuth();

  return (
    <HydroProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Index />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Project routes */}
          <Route path="/projects" element={
            <ProtectedRoute>
              <Layout>
                <Projects />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/projects/create" element={
            <ProtectedRoute>
              <Layout>
                <ProjectCreate />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/projects/:projectId/details" element={
            <ProtectedRoute>
              <Layout>
                <ProjectDetails />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Device routes */}
          <Route path="/devices" element={
            <ProtectedRoute>
              <Layout>
                <Devices />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/devices/create" element={
            <ProtectedRoute>
              <Layout>
                <DeviceCreate />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/devices/:deviceId/details" element={
            <ProtectedRoute>
              <Layout>
                <DeviceDetails />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/devices/:deviceId/code" element={
            <ProtectedRoute>
              <Layout>
                <DeviceCode />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/devices/:deviceId/config" element={
            <ProtectedRoute>
              <Layout>
                <DeviceConfig />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/devices/:deviceId/wifi-setup" element={
            <ProtectedRoute>
              <Layout>
                <DeviceWifiSetup />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Sensor readings route */}
          <Route path="/readings" element={
            <ProtectedRoute>
              <Layout>
                <Readings />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </HydroProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
