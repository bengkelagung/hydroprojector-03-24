
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import Image from 'next/image'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

export default function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          toast.error('Please verify your email first')
          // Redirect to resend verification page
          router.push(`/resend-verification?email=${encodeURIComponent(email)}`)
          return
        }
        throw error
      }

      if (data?.user) {
        toast.success('Login successful!')
        router.push('/dashboard')
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = () => {
    if (!email.trim()) {
      toast.error('Please enter your email address first')
      return
    }
    router.push(`/resend-verification?email=${encodeURIComponent(email)}`)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
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

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Sign in to your account</h1>
          <p className="text-gray-500">Or{' '}
            <Button
              variant="link"
              className="p-0 h-auto font-normal"
              onClick={() => router.push('/register')}
            >
              create a new account
            </Button>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your-email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={() => router.push('/forgot-password')}
              >
                Forgot password?
              </Button>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div className="space-y-4 text-center">
          <div className="text-sm text-gray-500">
            <p>Haven't verified your email yet?</p>
            <Button
              variant="outline"
              className="mt-2 w-full"
              onClick={handleResendVerification}
            >
              Resend verification email
            </Button>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Don't have an account?{' '}
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={() => router.push('/register')}
              >
                Sign up
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
