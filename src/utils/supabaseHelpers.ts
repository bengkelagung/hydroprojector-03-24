
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Execute a Supabase query with retry logic and error handling
 * @param queryFn Function that executes the Supabase query
 * @param errorMessage Custom error message to display
 * @param maxRetries Maximum number of retry attempts
 * @returns Result of the query or null if failed
 */
export async function executeWithRetry<T>(
  queryFn: () => Promise<any>, 
  errorMessage: string = 'Database operation failed',
  maxRetries: number = 3
): Promise<T | null> {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      const result = await queryFn();
      const { data, error } = result;
      
      if (error) {
        console.error(`Query error (attempt ${attempts + 1}/${maxRetries}):`, error);
        
        // Check if it's a resource error
        if (error.message?.includes('ERR_INSUFFICIENT_RESOURCES')) {
          // Dispatch custom event for resource error
          window.dispatchEvent(new CustomEvent('supabase-resource-error'));
          throw error;
        }
        
        // Check if it's a connection error
        if (
          error.message?.includes('Failed to fetch') || 
          error.code === 'ECONNREFUSED'
        ) {
          // Wait before retrying with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
          attempts++;
          continue;
        }
        
        // For other errors, throw immediately
        throw error;
      }
      
      return data;
    } catch (error: any) {
      console.error('executeWithRetry error:', error);
      
      // If it's a resource error, throw immediately without retrying
      if (error.message?.includes('ERR_INSUFFICIENT_RESOURCES')) {
        window.dispatchEvent(new CustomEvent('supabase-resource-error'));
        toast({
          title: "Server Overloaded",
          description: "The database is currently experiencing high load. Please try again later.",
          variant: "destructive"
        });
        return null;
      }
      
      // Show a toast notification for the last attempt
      if (attempts === maxRetries - 1) {
        toast({
          title: "Connection Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
      
      attempts++;
      
      // If it's the last attempt, return null
      if (attempts >= maxRetries) {
        return null;
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
    }
  }
  
  return null;
}

/**
 * Check if the Supabase connection is available
 * @returns Boolean indicating if the connection is available
 */
export async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const startTime = performance.now();
    const { error } = await supabase.from('projects').select('count').limit(1).single();
    const endTime = performance.now();
    
    // Log response time for monitoring
    console.log(`Supabase response time: ${endTime - startTime}ms`);
    
    return !error;
  } catch (error: any) {
    console.error('Supabase connection check failed:', error);
    
    // Check specifically for resource errors
    if (error?.message?.includes('ERR_INSUFFICIENT_RESOURCES')) {
      window.dispatchEvent(new CustomEvent('supabase-resource-error'));
    }
    
    return false;
  }
}

/**
 * Handle common Supabase errors with user-friendly messages
 * @param error The error object from Supabase
 * @param customMessage Optional custom message to display
 */
export function handleSupabaseError(error: any, customMessage?: string) {
  console.error('Supabase error:', error);
  
  let message = customMessage || 'An error occurred with the database operation';
  let variant: 'default' | 'destructive' | 'warning' = 'destructive';
  
  // Handle specific error types
  if (error?.message?.includes('Failed to fetch')) {
    message = 'Unable to connect to the server. Please check your internet connection.';
  } else if (error?.message?.includes('ERR_INSUFFICIENT_RESOURCES')) {
    message = 'The server is currently experiencing high load. Please try again later.';
    // Dispatch custom event for resource error
    window.dispatchEvent(new CustomEvent('supabase-resource-error'));
  } else if (error?.code === '23505') {
    message = 'A record with this information already exists.';
  } else if (error?.code === '42P01') {
    message = 'The requested data structure does not exist.';
  }
  
  toast({
    title: "Error",
    description: message,
    variant: variant
  });
}

/**
 * Check if device is online
 * @returns Boolean indicating if the device is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}
