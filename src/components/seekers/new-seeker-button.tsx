'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { NewSeekerDialog } from './new-seeker-dialog'

export function NewSeekerButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        New Seeker
      </Button>
      <NewSeekerDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
