import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

interface ErrorResponse {
  error: string;
  details?: unknown;
}

interface SuccessResponse {
  message: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    console.log('Starting user deletion process...')
    
    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log('Request body:', body);
    } catch (e) {
      console.error('Error parsing request body:', e);
      throw new Error('Invalid request body');
    }

    // Validate userId in request body
    const userId = body?.userId;
    if (!userId) {
      console.error('No userId provided in request body');
      throw new Error('userId is required in request body');
    }
    
    // Validate authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      throw new Error('No authorization header')
    }

    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables')
      throw new Error('Server configuration error')
    }
    
    console.log('Creating Supabase admin client...')
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Getting user information...')
    // Get the user using admin client
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (userError || !userData.user) {
      console.error('Error getting user:', userError)
      throw new Error(userError?.message || 'User not found')
    }

    console.log('User found:', userData.user.id)
    console.log('Calling cleanup function...')
    
    // Call the cleanup function
    const { error: cleanupError } = await supabaseAdmin
      .rpc('clean_up_user_data', {
        user_id: userData.user.id
      })

    if (cleanupError) {
      console.error('Error cleaning up user data:', cleanupError)
      throw new Error(`Failed to clean up user data: ${cleanupError.message}`)
    }

    console.log('User data cleaned up successfully')
    console.log('Deleting user auth record...')
    
    // Delete the user's auth record
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      userData.user.id
    )

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      throw new Error(`Failed to delete user: ${deleteError.message}`)
    }

    console.log('User deleted successfully')
    const response: SuccessResponse = { message: 'User deleted successfully' }
    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in delete-user function:', error)
    const errorResponse: ErrorResponse = { 
      error: error.message || 'An unknown error occurred',
      details: error
    }
    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message?.includes('Not authorized') ? 403 : 500,
      }
    )
  }
}) 