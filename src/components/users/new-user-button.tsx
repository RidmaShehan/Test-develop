'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { NewUserDialog } from './new-user-dialog'

export function NewUserButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        New User
      </Button>
      <NewUserDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
