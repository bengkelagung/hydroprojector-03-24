'use client'

import { useState } from 'react'
import { Button } from '../components/ui/button'
import DeleteAccountDialog from '../components/DeleteAccountDialog'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function Profile() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          
          {/* Other profile settings here */}
          
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
            <Button 
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete Account
            </Button>
          </div>
        </div>

        <DeleteAccountDialog 
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
        />
      </div>
    </div>
  )
} 