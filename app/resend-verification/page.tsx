
'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import EmailConfirmation from '../components/EmailConfirmation'

export default function ResendVerificationPage() {
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

  return <EmailConfirmation email={email} />
}
