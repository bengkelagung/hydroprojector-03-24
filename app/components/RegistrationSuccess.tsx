
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../../src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../src/components/ui/card'
import Image from 'next/image'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'

interface RegistrationSuccessProps {
  email: string
}

export default function RegistrationSuccess({ email }: RegistrationSuccessProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleResendEmail = async () => {
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

  const handleLoginClick = () => {
    router.push('/login')
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
            <CardTitle>Registration successful!</CardTitle>
            <CardDescription>
              Please check your email for verification
            </CardDescription>
            <p className="font-medium mt-2">{email}</p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <Button 
                onClick={handleResendEmail} 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Resend verification email'}
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLoginClick}
              >
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
