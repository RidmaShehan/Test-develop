'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface UserOption {
  id: string
  name: string
  email: string
  role: string
}

interface ImportRequestInquiriesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportSuccess: () => void
}

export function ImportRequestInquiriesDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: ImportRequestInquiriesDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [defaultCoordinatorId, setDefaultCoordinatorId] = useState<string>('none')
  const [defaultCampaignId, setDefaultCampaignId] = useState<string>('none')
  const [coordinators, setCoordinators] = useState<UserOption[]>([])
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string }>>([])
  const [loadingCoordinators, setLoadingCoordinators] = useState(false)
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      const fetchCoordinators = async () => {
        setLoadingCoordinators(true)
        try {
          const res = await fetch('/api/users/basic')
          if (res.ok) {
            const data = await res.json()
            // Keep only coordinators, admins, or developers who can act as coordinators
            const filtered = data.filter((u: UserOption) => 
              u.role === 'COORDINATOR' || 
              u.role === 'ADMIN' || 
              u.role === 'ADMINISTRATOR' || 
              u.role === 'DEVELOPER'
            )
            setCoordinators(filtered)
          }
        } catch (err) {
          console.error('Failed to load coordinators:', err)
        } finally {
          setLoadingCoordinators(false)
        }
      }
      const fetchCampaigns = async () => {
        setLoadingCampaigns(true)
        try {
          const res = await fetch('/api/campaigns?limit=500&forInquiry=true')
          if (res.ok) {
            const data = await res.json()
            setCampaigns(data.campaigns || [])
          }
        } catch (err) {
          console.error('Failed to load campaigns:', err)
        } finally {
          setLoadingCampaigns(false)
        }
      }
      void fetchCoordinators()
      void fetchCampaigns()
    }
  }, [open])

  const resetDialog = () => {
    setSelectedFile(null)
    setDefaultCoordinatorId('none')
    setDefaultCampaignId('none')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const name = file.name.toLowerCase()
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls') && !name.endsWith('.csv')) {
      toast.error('Only Excel (.xlsx, .xls) and CSV (.csv) files are accepted.')
      return
    }
    setSelectedFile(file)
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select an Excel or CSV file first.')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      if (defaultCoordinatorId && defaultCoordinatorId !== 'none') {
        formData.append('defaultCoordinatorId', defaultCoordinatorId)
      }
      if (defaultCampaignId && defaultCampaignId !== 'none') {
        formData.append('defaultCampaignId', defaultCampaignId)
      }

      const res = await fetch('/api/request-inquiries/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data?.error || 'Import failed.')
        return
      }

      const created = typeof data.created === 'number' ? data.created : 0
      const failed = typeof data.failed === 'number' ? data.failed : 0
      const errors = Array.isArray(data.errors) ? data.errors : []

      if (created > 0) {
        toast.success(`Successfully imported ${created} request inquiries.`)
        onImportSuccess()
      }

      if (failed > 0) {
        const preview = errors
          .slice(0, 5)
          .map((e: { row: number; message: string }) => `Row ${e.row}: ${e.message}`)
          .join('\n')
        toast.error(
          `${failed} row(s) failed to import.${preview ? `\n${preview}` : ''}${errors.length > 5 ? '\n…' : ''}`,
          { duration: 10000 }
        )
      }

      if (created === 0 && failed === 0) {
        toast.info('No data rows found in the file.')
      }

      onOpenChange(false)
      resetDialog()
    } catch (err) {
      console.error('Import error:', err)
      toast.error('Import failed. Please check the file formatting and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileChange}
      />

      <Dialog
        open={open}
        onOpenChange={(v) => {
          onOpenChange(v)
          if (!v) resetDialog()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Request Inquiries</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5 py-3">
            <div className="text-sm text-gray-500 leading-relaxed">
              Upload an Excel or CSV spreadsheet containing exhibition visitors. 
              The file must contain columns named <span className="font-semibold text-gray-700">Name</span> (or Full Name) 
              and <span className="font-semibold text-gray-700">Phone</span> (or Contact). 
              Optional columns: <span className="font-semibold text-gray-700">Program</span>, <span className="font-semibold text-gray-700">Addressee</span>, 
              <span className="font-semibold text-gray-700">Coordinator</span>, and <span className="font-semibold text-gray-700">Campaign</span>.
            </div>

            <div 
              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50/50 transition cursor-pointer" 
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              {selectedFile ? (
                <span className="text-sm font-medium text-blue-600 truncate max-w-xs">{selectedFile.name}</span>
              ) : (
                <span className="text-sm text-gray-600 font-medium">Click to select Excel or CSV file</span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-coordinator" className="text-sm font-medium text-gray-700">
                Default Coordinator (Optional)
              </Label>
              <Select
                value={defaultCoordinatorId}
                onValueChange={setDefaultCoordinatorId}
                disabled={loadingCoordinators}
              >
                <SelectTrigger id="default-coordinator">
                  <SelectValue placeholder={loadingCoordinators ? 'Loading coordinators...' : 'Select a default coordinator'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Do not assign default)</SelectItem>
                  {coordinators.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">
                If the spreadsheet has a &quot;Coordinator&quot; column, it will overwrite this default on matching names/emails.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-campaign" className="text-sm font-medium text-gray-700">
                Default Campaign (Optional)
              </Label>
              <Select
                value={defaultCampaignId}
                onValueChange={setDefaultCampaignId}
                disabled={loadingCampaigns}
              >
                <SelectTrigger id="default-campaign">
                  <SelectValue placeholder={loadingCampaigns ? 'Loading campaigns...' : 'Select a default campaign'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Do not assign default)</SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">
                If the spreadsheet has a &quot;Campaign&quot; column, it will overwrite this default on matching campaign names.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-4 mt-2">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => {
                onOpenChange(false)
                resetDialog()
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={submitting || !selectedFile}
              onClick={handleImport}
              className="gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Importing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
