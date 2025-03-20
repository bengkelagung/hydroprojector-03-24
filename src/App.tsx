
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { HydroProvider } from './contexts/HydroContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DeviceCreate from './pages/DeviceCreate';
import DeviceDetails from './pages/DeviceDetails';
import DeviceCode from './pages/DeviceCode';
import ProjectCreate from './pages/ProjectCreate';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Devices from './pages/Devices';
import Readings from './pages/Readings';
import DeviceWifiSetup from './pages/DeviceWifiSetup';
import DeviceConfig from './pages/DeviceConfig';
import NotFound from './pages/NotFound';
import Index from './pages/Index';
import Charts from './pages/Charts';
import { Toaster } from './components/ui/toaster';
import { Toaster as SonnerToaster } from "sonner";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: (
      <AuthProvider>
        <HydroProvider>
          <Layout />
        </HydroProvider>
      </AuthProvider>
    ),
    children: [
      {
        path: '/',
        element: <Index />,
      },
      {
        path: '/dashboard',
        element: <Dashboard />,
      },
      {
        path: '/devices',
        element: <Devices />,
      },
      {
        path: '/devices/:deviceId/details',
        element: <DeviceDetails />,
      },
      {
        path: '/devices/:deviceId/wifi-setup',
        element: <DeviceWifiSetup />,
      },
      {
        path: '/devices/:deviceId/config',
        element: <DeviceConfig />,
      },
      {
        path: '/devices/create',
        element: <DeviceCreate />,
      },
      {
        path: '/devices/:deviceId/code',
        element: <DeviceCode />,
      },
      {
        path: '/projects',
        element: <Projects />,
      },
      {
        path: '/projects/create',
        element: <ProjectCreate />,
      },
      {
        path: '/projects/:projectId',
        element: <ProjectDetails />,
      },
      {
        path: '/readings',
        element: <Readings />,
      },
      {
        path: '/charts',
        element: <Charts />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
      <SonnerToaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;
