
import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

/**
 * Custom hook to handle JWT session management and auto-refreshing
 */
export const useSessionRefresh = () => {
  const { refreshSession } = useAuth();

  /**
   * Wraps an operation with automatic session refresh when JWT expires
   * @param operation Function that returns a promise to be executed
   * @returns Result of the operation or null if it fails
   */
  const withSessionRefresh = useCallback(async <T,>(operation: () => Promise<T>): Promise<T | null> => {
    try {
      return await operation();
    } catch (error: any) {
      // Check if the error is due to JWT expiration
      if (error?.message === 'JWT expired' || error?.code === 'PGRST301') {
        console.log('Token expired, attempting to refresh session...');
        const refreshed = await refreshSession();
        
        if (refreshed) {
          try {
            // Retry the operation after successful refresh
            return await operation();
          } catch (retryError) {
            console.error('Operation failed after token refresh:', retryError);
            toast({
              title: "Operation Failed",
              description: "Please try again or reload the page.",
              variant: "destructive",
            });
            return null;
          }
        } else {
          console.error('Failed to refresh session');
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
          return null;
        }
      }
      
      // For other types of errors, rethrow
      throw error;
    }
  }, [refreshSession]);

  return { withSessionRefresh };
};
