
'use client'

import * as React from 'react'
import { useState } from 'react'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import ResendVerification from './ResendVerification'
import Image from 'next/image'

interface EmailConfirmationProps {
  email: string
}

export default function EmailConfirmation({ email }: EmailConfirmationProps) {
  const router = useRouter()

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

        <div className="rounded-lg border bg-card p-8 text-card-foreground shadow-sm">
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Check your email
              </h1>
              <p className="text-sm text-muted-foreground">
                We've sent a verification link to
              </p>
              <p className="font-medium">{email}</p>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the link in the email to verify your account and complete the registration.
              </p>
              
              <ResendVerification email={email} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
