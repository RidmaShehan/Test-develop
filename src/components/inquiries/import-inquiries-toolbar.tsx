'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { safeJsonParse } from '@/lib/utils'

interface CampaignOption {
  id: string
  name: string
  type?: string
}

interface CampaignTypeOption {
  id: string
  name: string
}

export function ImportInquiriesToolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importPassword, setImportPassword] = useState('')
  const [campaignId, setCampaignId] = useState('')
  const [marketingSource, setMarketingSource] = useState('')
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([])
  const [campaignTypes, setCampaignTypes] = useState<CampaignTypeOption[]>([])
  const [loadingMeta, setLoadingMeta] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const loadMeta = useCallback(async () => {
    setLoadingMeta(true)
    try {
      const [campRes, typesRes] = await Promise.all([
        fetch('/api/campaigns?forInquiry=true&page=1&limit=200'),
        fetch('/api/campaign-types?forInquiry=true'),
      ])
      if (campRes.status === 401 || typesRes.status === 401) {
        toast.error('Session expired. Please sign in again.')
        return
      }
      if (campRes.ok) {
        const data = await safeJsonParse(campRes)
        const list = data.campaigns || []
        setCampaigns(list)
      } else {
        setCampaigns([])
      }
      if (typesRes.ok) {
        const types = await safeJsonParse(typesRes)
        const arr = Array.isArray(types) ? types : []
        setCampaignTypes(arr.filter((t: CampaignTypeOption & { isActive?: boolean }) => t.isActive !== false))
      } else {
        setCampaignTypes([])
      }
    } catch {
      toast.error('Could not load campaigns or marketing sources.')
    } finally {
      setLoadingMeta(false)
    }
  }, [])

  useEffect(() => {
    if (dialogOpen) {
      void loadMeta()
    }
  }, [dialogOpen, loadMeta])

  const resetDialog = () => {
    setSelectedFile(null)
    setImportPassword('')
    setCampaignId('')
    setMarketingSource('')
  }

  const handleDownloadTemplate = async () => {
    setDownloading(true)
    try {
      const res = await fetch('/api/inquiries/import/template')
      if (res.status === 401) {
        toast.error('Session expired. Please sign in again.')
        return
      }
      if (!res.ok) {
        toast.error('Could not download the template.')
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'inquiry-import-template.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Template downloaded.')
    } catch {
      toast.error('Could not download the template.')
    } finally {
      setDownloading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const name = file.name.toLowerCase()
    if (!name.endsWith('.xlsx')) {
      toast.error('Only .xlsx files are accepted. Use the downloaded template.')
      return
    }
    setSelectedFile(file)
    setDialogOpen(true)
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Choose an Excel file first.')
      return
    }
    if (!importPassword.trim()) {
      toast.error('Enter the import password.')
      return
    }
    if (!campaignId) {
      toast.error('Select a campaign.')
      return
    }
    if (!marketingSource) {
      toast.error('Select a marketing source.')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('importPassword', importPassword)
      formData.append('campaignId', campaignId)
      formData.append('marketingSource', marketingSource)

      const res = await fetch('/api/inquiries/import', {
        method: 'POST',
        body: formData,
      })

      const data = await safeJsonParse(res)

      if (res.status === 401) {
        toast.error('Session expired. Please sign in again.')
        return
      }
      if (res.status === 403) {
        toast.error(data?.error || 'Incorrect import password.')
        return
      }
      if (!res.ok) {
        toast.error(data?.error || 'Import failed.')
        return
      }

      const created = typeof data.created === 'number' ? data.created : 0
      const failed = typeof data.failed === 'number' ? data.failed : 0
      const errors = Array.isArray(data.errors) ? data.errors : []

      if (created > 0) {
        toast.success(`Imported ${created} inquiry(ies).`)
        window.dispatchEvent(new CustomEvent('inquiries-imported'))
      }
      if (failed > 0) {
        const preview = errors
          .slice(0, 5)
          .map((e: { row: number; message: string }) => `Row ${e.row}: ${e.message}`)
          .join('\n')
        toast.error(
          `${failed} row(s) failed.${preview ? `\n${preview}` : ''}${errors.length > 5 ? '\n…' : ''}`,
          { duration: 12000 }
        )
      }
      if (created === 0 && failed === 0) {
        toast.info('No data rows found in the file.')
      }

      setDialogOpen(false)
      resetDialog()
    } catch {
      toast.error('Import failed. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        size="default"
        className="shadow-sm"
        disabled={downloading}
        onClick={() => void handleDownloadTemplate()}
      >
        <Download className="h-4 w-4 mr-2" />
        {downloading ? 'Downloading…' : 'Download import template'}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="default"
        className="shadow-sm"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-4 w-4 mr-2" />
        Import from Excel
      </Button>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetDialog()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import inquiries from Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Only files that match the official template (sheet &quot;InquiryImport&quot; and exact
              headers) are accepted. Campaign and marketing source apply to every row in the file.
            </p>
            {selectedFile && (
              <p className="text-foreground font-medium truncate" title={selectedFile.name}>
                File: {selectedFile.name}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="import-password">Import password</Label>
              <Input
                id="import-password"
                type="password"
                autoComplete="new-password"
                value={importPassword}
                onChange={(e) => setImportPassword(e.target.value)}
                placeholder="Enter import password"
              />
            </div>
            <div className="space-y-2">
              <Label>Campaign</Label>
              <Select
                value={campaignId || undefined}
                onValueChange={setCampaignId}
                disabled={loadingMeta}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingMeta ? 'Loading…' : 'Select campaign'} />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Marketing source</Label>
              <Select
                value={marketingSource || undefined}
                onValueChange={setMarketingSource}
                disabled={loadingMeta}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingMeta ? 'Loading…' : 'Select marketing source'} />
                </SelectTrigger>
                <SelectContent>
                  {campaignTypes.map((t) => (
                    <SelectItem key={t.id} value={t.name}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialogOpen(false)
                resetDialog()
              }}
            >
              Cancel
            </Button>
            <Button type="button" disabled={submitting} onClick={() => void handleImport()}>
              {submitting ? 'Importing…' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
