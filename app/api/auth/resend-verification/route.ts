import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { email } = await request.json()

  try {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${request.headers.get('origin')}/auth/callback`
      }
    })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to resend verification email' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Verification email resent successfully' },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 