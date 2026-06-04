'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Database, Download, FileCode, History, RefreshCw, Loader2, FileSpreadsheet } from 'lucide-react'

interface BackupLogEntry {
  id: string
  activityType: string
  timestamp: string
  metadata?: {
    action?: string
    time?: string
    tables?: string[]
    filename?: string
  }
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

export function DatabaseBackupDashboard() {
  const [history, setHistory] = useState<BackupLogEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [downloadingFull, setDownloadingFull] = useState(false)
  const [downloadingSchema, setDownloadingSchema] = useState(false)
  const [downloadingRqFull, setDownloadingRqFull] = useState(false)
  const [downloadingRqSchema, setDownloadingRqSchema] = useState(false)
  const [downloadingRqSpreadsheet, setDownloadingRqSpreadsheet] = useState(false)

  const fetchHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/backup/history')
      if (res.ok) {
        const data = await res.json()
        setHistory(data.history || [])
      }
    } catch {
      setHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const downloadBackup = async (type: 'full' | 'schema') => {
    const setBusy = type === 'full' ? setDownloadingFull : setDownloadingSchema
    setBusy(true)
    try {
      const res = await fetch(`/api/backup/${type}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Download failed: ${res.status}`)
      }
      const blob = await res.blob()
      const name = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1]
        || (type === 'full' ? 'backup-full.sql' : 'schema-export.sql')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
      await fetchHistory()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Download failed')
    } finally {
      setBusy(false)
    }
  }

  const downloadRequestInquiryBackup = async (type: 'full' | 'schema') => {
    const setBusy = type === 'full' ? setDownloadingRqFull : setDownloadingRqSchema
    setBusy(true)
    try {
      const res = await fetch(`/api/backup/request-inquiry/${type}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Download failed: ${res.status}`)
      }
      const blob = await res.blob()
      const name =
        res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ||
        (type === 'full'
          ? 'request-inquiry-backup-full.sql'
          : 'request-inquiry-schema.sql')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Download failed')
    } finally {
      setBusy(false)
    }
  }

  const downloadRequestInquirySpreadsheet = async () => {
    setDownloadingRqSpreadsheet(true)
    try {
      const res = await fetch('/api/backup/request-inquiry/export')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Download failed: ${res.status}`)
      }
      const blob = await res.blob()
      const name =
        res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ||
        `request-inquiry-migration-${new Date().toISOString().slice(0, 10)}.xlsx`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Download failed')
    } finally {
      setDownloadingRqSpreadsheet(false)
    }
  }

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Database Backup</h1>
        <p className="text-muted-foreground">
          Export full data as migrations (schema + data) or table structure only (PostgreSQL/SQL). All exports are recorded in the backup history log.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Full backup (migrations + data)
            </CardTitle>
            <CardDescription>
              Download a complete backup as SQL: table definitions and all row data. Use for migrations or full restore.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => downloadBackup('full')}
              disabled={downloadingFull}
              className="w-full"
            >
              {downloadingFull ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {downloadingFull ? 'Generating…' : 'Download full backup (.sql)'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              Table structure (PostgreSQL / SQL)
            </CardTitle>
            <CardDescription>
              Download DDL only: CREATE TABLE statements for all public tables. No data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => downloadBackup('schema')}
              disabled={downloadingSchema}
              className="w-full"
            >
              {downloadingSchema ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {downloadingSchema ? 'Generating…' : 'Download schema only (.sql)'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Request Inquiry DB – full backup (migrations + data)
            </CardTitle>
            <CardDescription>
              Download a complete backup as SQL: table definitions and all row data
              for the Request Inquiry database. Use for migrations or full restore.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => downloadRequestInquiryBackup('full')}
              disabled={downloadingRqFull}
              className="w-full"
            >
              {downloadingRqFull ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {downloadingRqFull
                ? 'Generating…'
                : 'Download Request Inquiry full backup (.sql)'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              Request Inquiry DB – schema only
            </CardTitle>
            <CardDescription>
              Export only table structure (DDL) for the Request Inquiry database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => downloadRequestInquiryBackup('schema')}
              disabled={downloadingRqSchema}
              className="w-full"
            >
              {downloadingRqSchema ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {downloadingRqSchema
                ? 'Generating…'
                : 'Download Request Inquiry schema only (.sql)'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Request Inquiry – spreadsheet for migration
            </CardTitle>
            <CardDescription>
              Download all Request Inquiry data as Excel (.xlsx): Exhibition Visitors, Programs, Visitor Programs, and Visitor Metadata. Use to migrate or audit data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={downloadRequestInquirySpreadsheet}
              disabled={downloadingRqSpreadsheet}
              className="w-full"
            >
              {downloadingRqSpreadsheet ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              {downloadingRqSpreadsheet
                ? 'Generating…'
                : 'Download spreadsheet (.xlsx)'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Backup history
            </CardTitle>
            <CardDescription>
              Log of generated backups. Tables included and filename are stored for each export.
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchHistory} disabled={loadingHistory}>
            <RefreshCw className={loadingHistory ? 'animate-spin h-4 w-4' : 'h-4 w-4'} />
          </Button>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No backup or schema exports yet. Generate one using the buttons above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Filename</TableHead>
                  <TableHead>Tables</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.activityType === 'DATA_BACKUP' ? 'default' : 'secondary'}>
                        {entry.activityType === 'DATA_BACKUP' ? 'Full backup' : 'Schema export'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.user?.name || entry.user?.email || '—'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {entry.metadata?.filename || '—'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground" title={(entry.metadata?.tables || []).join(', ')}>
                      {(entry.metadata?.tables || []).length} table(s)
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
