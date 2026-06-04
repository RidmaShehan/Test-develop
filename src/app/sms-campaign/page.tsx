'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Plus, Send, Trash2, Phone, Users } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface Recipient { name: string; phone: string }

export default function SmsCampaignPage() {
  const [message, setMessage] = useState('')
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [tab, setTab] = useState<'compose' | 'history'>('compose')

  const fetchHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/sms/history')
      const data = await res.json()
      if (data.success) setHistory(data.data)
    } catch {}
    finally { setHistoryLoading(false) }
  }

  useEffect(() => { fetchHistory() }, [])

  const addRecipient = () => {
    if (!newPhone.trim()) { toast.error('Phone number is required'); return }
    setRecipients([...recipients, { name: newName, phone: newPhone }])
    setNewName('')
    setNewPhone('')
  }

  const removeRecipient = (idx: number) => setRecipients(recipients.filter((_, i) => i !== idx))

  const sendCampaign = async () => {
    if (!message.trim()) { toast.error('Message is required'); return }
    if (recipients.length === 0) { toast.error('Add at least one recipient'); return }
    setIsLoading(true)
    try {
      const res = await fetch('/api/sms/bulk-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, recipients }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'SMS campaign sent!')
        setMessage('')
        setRecipients([])
        fetchHistory()
        setTab('history')
      } else toast.error(data.error || 'Failed')
    } catch { toast.error('Failed to send') }
    finally { setIsLoading(false) }
  }

  const charCount = message.length
  const smsCount = Math.ceil(charCount / 160) || 1

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="pb-4 border-b border-gray-200">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">SMS Campaign</h1>
          <p className="text-sm text-gray-600">Send bulk SMS messages to students and leads</p>
        </div>

        <div className="flex gap-2">
          {(['compose', 'history'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {t === 'compose' ? 'Compose' : 'Send History'}
            </button>
          ))}
        </div>

        {tab === 'compose' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Message */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">Message</h2>
              <div className="space-y-1.5">
                <Label>SMS Content</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here. Use {{name}} for personalization."
                  rows={5}
                  maxLength={480}
                />
                <p className="text-xs text-slate-400 text-right">{charCount}/480 chars · {smsCount} SMS</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-xs text-slate-500 space-y-1">
                <p className="font-medium text-slate-600 dark:text-slate-300">Personalization tags:</p>
                <p><code className="bg-white dark:bg-slate-700 px-1 rounded">{'{{name}}'}</code> — replaced with recipient name</p>
              </div>
            </div>

            {/* Recipients */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800 dark:text-slate-100">Recipients</h2>
                <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-0">
                  <Users className="w-3 h-3 mr-1" />{recipients.length}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Input placeholder="Name (optional)" value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1" />
                <Input placeholder="Phone *" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="flex-1" />
                <Button size="sm" onClick={addRecipient} className="gap-1"><Plus className="w-4 h-4" /></Button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {recipients.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">No recipients added yet</p>
                ) : (
                  recipients.map((r, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="flex-1 text-sm">{r.name || '(No name)'} — {r.phone}</span>
                      <button onClick={() => removeRecipient(idx)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))
                )}
              </div>

              <Button
                onClick={sendCampaign}
                disabled={isLoading || !message || recipients.length === 0}
                className="w-full gap-2"
              >
                {isLoading ? 'Sending...' : <><Send className="w-4 h-4" />Send to {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}</>}
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {historyLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
                <p>No SMS campaigns sent yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      {['Message', 'Sent By', 'Recipients', 'Delivered', 'Date'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {history.map((msg: any) => (
                      <tr key={msg.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-sm text-slate-700 dark:text-slate-200 truncate">{msg.body}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{msg.createdBy?.name}</td>
                        <td className="px-4 py-3 text-sm font-medium">{msg._count?.recipients ?? 0}</td>
                        <td className="px-4 py-3 text-sm text-green-600">{msg.recipients?.length ?? 0}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{format(new Date(msg.createdAt), 'dd MMM yyyy, HH:mm')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
