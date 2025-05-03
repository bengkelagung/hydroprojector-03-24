'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import RegistrationSuccess from '../components/RegistrationSuccess'

export default function RegistrationSuccessPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  if (!email) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Invalid Request</h1>
          <p className="mt-2">No email address provided.</p>
        </div>
      </div>
    )
  }

  return <RegistrationSuccess email={email} />
} 