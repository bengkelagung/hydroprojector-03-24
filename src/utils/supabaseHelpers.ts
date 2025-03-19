
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
  queryFn: () => Promise<{ data: T; error: any }>, 
  errorMessage: string = 'Database operation failed',
  maxRetries: number = 3
): Promise<T | null> {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      const { data, error } = await queryFn();
      
      if (error) {
        console.error(`Query error (attempt ${attempts + 1}/${maxRetries}):`, error);
        
        // Check if it's a connection error
        if (
          error.message?.includes('Failed to fetch') || 
          error.code === 'ECONNREFUSED' ||
          error.code === 'ERR_INSUFFICIENT_RESOURCES'
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
    const { data, error } = await supabase.from('projects').select('count').limit(1).single();
    const endTime = performance.now();
    
    // Log response time for monitoring
    console.log(`Supabase response time: ${endTime - startTime}ms`);
    
    return !error;
  } catch (error) {
    console.error('Supabase connection check failed:', error);
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
  
  // Handle specific error types
  if (error?.message?.includes('Failed to fetch')) {
    message = 'Unable to connect to the server. Please check your internet connection.';
  } else if (error?.code === 'ERR_INSUFFICIENT_RESOURCES') {
    message = 'The server is currently experiencing high load. Please try again later.';
  } else if (error?.code === '23505') {
    message = 'A record with this information already exists.';
  } else if (error?.code === '42P01') {
    message = 'The requested data structure does not exist.';
  }
  
  toast({
    title: "Error",
    description: message,
    variant: "destructive"
  });
}
