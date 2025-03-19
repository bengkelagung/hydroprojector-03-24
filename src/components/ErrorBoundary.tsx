
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Wifi, ServerCrash } from 'lucide-react';
import { isOnline } from '@/utils/supabaseHelpers';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isOffline: boolean;
  isResourceError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isOffline: false,
    isResourceError: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Check for specific error types
    const isResourceError = error.message?.includes('ERR_INSUFFICIENT_RESOURCES');
    const isOffline = !navigator.onLine || error.message?.includes('Failed to fetch');
    
    return { 
      hasError: true, 
      error, 
      isOffline,
      isResourceError
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
    
    // Update state with error info
    this.setState({ 
      errorInfo,
      isOffline: !navigator.onLine || error.message?.includes('Failed to fetch'),
      isResourceError: error.message?.includes('ERR_INSUFFICIENT_RESOURCES')
    });
    
    // Try to recover from network errors automatically
    if (!navigator.onLine || error.message?.includes('Failed to fetch')) {
      window.addEventListener('online', this.handleOnline);
    }
  }
  
  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
  }
  
  private handleOnline = () => {
    // When back online, try to reset the error state
    if (this.state.isOffline && navigator.onLine) {
      this.handleReset();
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, isOffline: false, isResourceError: false });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const { fallback } = this.props;
      
      if (fallback) {
        return fallback;
      }
      
      // Customize error based on type
      let errorTitle = "Something went wrong";
      let errorDescription = "The application encountered an error";
      let errorIcon = <AlertTriangle className="h-6 w-6" />;
      
      if (this.state.isOffline) {
        errorTitle = "You're Offline";
        errorDescription = "Please check your internet connection";
        errorIcon = <Wifi className="h-6 w-6" />;
      } else if (this.state.isResourceError) {
        errorTitle = "Server Overloaded";
        errorDescription = "The database is currently experiencing high load";
        errorIcon = <ServerCrash className="h-6 w-6" />;
      }
      
      return (
        <div className="container mx-auto py-8 px-4">
          <Card className="max-w-xl mx-auto border-red-200">
            <CardHeader className="bg-red-50 text-red-800">
              <div className="flex items-center gap-2">
                {errorIcon}
                <CardTitle>{errorTitle}</CardTitle>
              </div>
              <CardDescription className="text-red-700">
                {errorDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Error message:</h3>
                  <p className="text-gray-700 text-sm mt-1 p-2 bg-gray-50 rounded border">
                    {this.state.error?.message || 'Unknown error'}
                  </p>
                </div>
                {this.state.error?.stack && !this.state.isOffline && !this.state.isResourceError && (
                  <div>
                    <h3 className="font-medium">Stack trace:</h3>
                    <pre className="text-xs mt-1 p-2 bg-gray-50 rounded border overflow-auto max-h-32">
                      {this.state.error.stack}
                    </pre>
                  </div>
                )}
                {(this.state.isOffline || this.state.isResourceError) && (
                  <div className="bg-amber-50 p-3 rounded border border-amber-200 text-amber-800">
                    {this.state.isOffline 
                      ? "Your app will work with limited functionality until your connection is restored."
                      : "The app will use cached data until the server load decreases."}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between bg-gray-50">
              <p className="text-sm text-gray-500">
                {this.state.isOffline 
                  ? "Check your network connection and try again" 
                  : "Try refreshing the page or going back to the previous screen"}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={this.handleReset}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={this.handleReload}>
                  Reload Page
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
