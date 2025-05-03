import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  // List of public paths that don't require authentication
  const publicPaths = [
    '/login',
    '/register',
    '/resend-verification',
    '/auth/callback'
  ]

  // Check if the current path is public
  const isPublicPath = publicPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )

  // If path is public, allow access
  if (isPublicPath) {
    return res
  }

  // If user is not logged in and trying to access protected route
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 