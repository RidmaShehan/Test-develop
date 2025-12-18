'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { NewProgramDialog } from './new-program-dialog'

export function NewProgramButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        New Program
      </Button>
      <NewProgramDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
