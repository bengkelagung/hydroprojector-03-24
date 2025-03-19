
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
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
      
      return (
        <div className="container mx-auto py-8 px-4">
          <Card className="max-w-xl mx-auto border-red-200">
            <CardHeader className="bg-red-50 text-red-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription className="text-red-700">
                The application encountered an error
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
                {this.state.error?.stack && (
                  <div>
                    <h3 className="font-medium">Stack trace:</h3>
                    <pre className="text-xs mt-1 p-2 bg-gray-50 rounded border overflow-auto max-h-32">
                      {this.state.error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between bg-gray-50">
              <p className="text-sm text-gray-500">
                Try refreshing the page or going back to the previous screen
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
