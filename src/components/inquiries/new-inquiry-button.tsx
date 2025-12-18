'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Command } from 'lucide-react'
import { NewInquiryDialog } from './new-inquiry-dialog'
import { useModifierKey } from '@/hooks/use-global-shortcuts'

export function NewInquiryButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Global keyboard shortcut: Cmd/Ctrl + Enter to open new inquiry dialog
  useModifierKey('Enter', () => {
    // Only open if dialog is not already open
    if (!isDialogOpen) {
      setIsDialogOpen(true)
    }
  }, {
    description: 'Create new inquiry'
  })

  return (
    <>
      <Button 
        onClick={() => setIsDialogOpen(true)} 
        className="shadow-sm relative group"
        title="Create new inquiry (⌘/Ctrl + Enter)"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add New Inquiry
        <kbd className="hidden group-hover:inline-flex ml-2 px-1.5 py-0.5 text-xs bg-white/20 border border-white/30 rounded">
          ⌘↵
        </kbd>
      </Button>
      <NewInquiryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  )
}
