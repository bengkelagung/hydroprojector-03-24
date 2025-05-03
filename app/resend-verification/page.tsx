'use client'

import React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../src/components/ui/card"
import { Button } from "../../src/components/ui/button"
import Image from 'next/image'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'

export default function ResendVerificationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email')
  const [isLoading, setIsLoading] = React.useState(false)

  const handleResend = async () => {
    if (!email) return
    
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
      toast.success('Verification email has been resent!')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!email) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <CardTitle>Invalid Request</CardTitle>
            <CardDescription>
              No email address provided. Please try registering again.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={() => router.push('/register')} className="w-full">
              Go to Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center space-x-2">
            <Image 
              src="/hydroprojekt-logo.svg" 
              alt="HydroProjekt Logo" 
              width={40} 
              height={40} 
            />
            <span className="text-2xl font-bold">HydroProjekt</span>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We've sent a verification link to
            </CardDescription>
            <p className="font-medium mt-2">{email}</p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">⚠️ If you don't see the email in your inbox:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Check your spam/junk folder</li>
                <li>Mark the email as "Not Spam" if found in spam folder</li>
                <li>Add noreply@hydroprojekt.com to your contacts</li>
                <li>Check both Primary and Promotions tabs in Gmail</li>
                <li>Wait a few minutes as email delivery might be delayed</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={handleResend} 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Resend verification email'}
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/login')}
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 