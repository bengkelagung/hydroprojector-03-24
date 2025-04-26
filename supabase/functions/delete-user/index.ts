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
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }
    
    console.log('Creating Supabase client...')
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    console.log('Getting user information...')
    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError) {
      console.error('Error getting user:', userError)
      throw userError
    }

    if (!user) {
      console.error('No user found')
      throw new Error('Could not get user')
    }

    console.log('User found:', user.id)
    console.log('Calling cleanup function...')
    
    // Call the cleanup function
    const { error: cleanupError } = await supabaseClient
      .rpc('clean_up_user_data', {
        user_id: user.id
      })

    if (cleanupError) {
      console.error('Error cleaning up user data:', cleanupError)
      throw cleanupError
    }

    console.log('User data cleaned up successfully')
    console.log('Deleting user auth record...')
    
    // Delete the user's auth record
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(
      user.id
    )

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      throw deleteError
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
      error: error.message || 'An unknown error occurred'
    }
    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 