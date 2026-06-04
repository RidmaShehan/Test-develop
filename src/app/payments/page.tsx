'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { CreditCard, Plus, Search, CheckCircle2, Clock, AlertCircle, DollarSign, Trash2, X } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  PARTIAL: 'bg-blue-100 text-blue-800 border-blue-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
  REFUNDED: 'bg-slate-100 text-slate-600 border-slate-200',
}

interface InvoiceItem { description: string; qty: number; unitPrice: number }

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [newInvoice, setNewInvoice] = useState(false)
  const [payDialog, setPayDialog] = useState<{ open: boolean; invoiceId: string; invoiceNo: string; remaining: number }>({ open: false, invoiceId: '', invoiceNo: '', remaining: 0 })

  // New invoice form
  const [seekerSearch, setSeekerSearch] = useState('')
  const [seekerResults, setSeekerResults] = useState<any[]>([])
  const [selectedSeeker, setSelectedSeeker] = useState<any>(null)
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', qty: 1, unitPrice: 0 }])
  const [discount, setDiscount] = useState(0)
  const [invoiceNotes, setInvoiceNotes] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Payment form
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('CASH')
  const [payRef, setPayRef] = useState('')

  const fetchInvoices = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/payments?${params}`)
      const data = await res.json()
      if (data.success) setInvoices(data.data)
    } catch { toast.error('Failed to load invoices') }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchInvoices() }, [statusFilter])

  const searchSeekers = async (q: string) => {
    if (!q.trim()) { setSeekerResults([]); return }
    try {
      const res = await fetch(`/api/inquiries?search=${encodeURIComponent(q)}&limit=10`)
      const data = await res.json()
      setSeekerResults(data.data || data.seekers || [])
    } catch {}
  }

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const total = subtotal - discount

  const createInvoice = async () => {
    if (!selectedSeeker) { toast.error('Please select a student'); return }
    if (items.some((i) => !i.description)) { toast.error('All items need a description'); return }
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seekerId: selectedSeeker.id, items, discount, notes: invoiceNotes, dueDate }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Invoice created')
        setNewInvoice(false)
        setSelectedSeeker(null)
        setItems([{ description: '', qty: 1, unitPrice: 0 }])
        setDiscount(0)
        fetchInvoices()
      } else toast.error(data.error || 'Failed')
    } catch { toast.error('Failed to create invoice') }
    finally { setIsSubmitting(false) }
  }

  const recordPayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) { toast.error('Please enter a valid amount'); return }
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/payments/${payDialog.invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'record_payment', amount: Number(payAmount), method: payMethod, reference: payRef }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Payment recorded')
        setPayDialog({ open: false, invoiceId: '', invoiceNo: '', remaining: 0 })
        setPayAmount('')
        setPayRef('')
        fetchInvoices()
      } else toast.error(data.error || 'Failed')
    } catch { toast.error('Failed to record payment') }
    finally { setIsSubmitting(false) }
  }

  const filtered = invoices.filter((inv) =>
    search
      ? inv.seeker?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        inv.invoiceNo?.toLowerCase().includes(search.toLowerCase())
      : true
  )

  const stats = {
    total: invoices.length,
    pending: invoices.filter((i) => i.status === 'PENDING').length,
    paid: invoices.filter((i) => i.status === 'PAID').length,
    totalRevenue: invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + Number(i.total), 0),
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Payments & Invoicing</h1>
            <p className="text-sm text-gray-600">Track student invoices and payments</p>
          </div>
          <Button onClick={() => setNewInvoice(true)} className="gap-2">
            <Plus className="w-4 h-4" />New Invoice
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Invoices', val: stats.total, icon: CreditCard, color: 'text-slate-600' },
            { label: 'Pending', val: stats.pending, icon: Clock, color: 'text-yellow-600' },
            { label: 'Paid', val: stats.paid, icon: CheckCircle2, color: 'text-green-600' },
            { label: 'Revenue', val: `LKR ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-blue-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3">
              <s.icon className={cn('w-8 h-8', s.color)} />
              <div>
                <p className={cn('text-2xl font-bold', s.color)}>{s.val}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search student or invoice #..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invoices */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <CreditCard className="w-12 h-12 mb-3 opacity-30" />
              <p>No invoices found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    {['Invoice #', 'Student', 'Amount', 'Paid', 'Status', 'Due Date', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filtered.map((inv) => {
                    const paid = inv.payments.reduce((s: number, p: any) => s + Number(p.amount), 0)
                    const remaining = Number(inv.total) - paid
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-sm font-medium text-slate-700">{inv.invoiceNo}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800 dark:text-slate-100">{inv.seeker?.fullName}</p>
                          <p className="text-xs text-slate-400">{inv.seeker?.email}</p>
                        </td>
                        <td className="px-4 py-3 font-medium">LKR {Number(inv.total).toLocaleString()}</td>
                        <td className="px-4 py-3 text-green-600">LKR {paid.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <Badge className={cn('text-xs border', STATUS_COLORS[inv.status] ?? 'bg-slate-100')}>{inv.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {inv.dueDate ? format(new Date(inv.dueDate), 'dd MMM yyyy') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {inv.status !== 'PAID' && remaining > 0 && (
                            <Button size="sm" className="h-7 px-2.5 text-xs bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => setPayDialog({ open: true, invoiceId: inv.id, invoiceNo: inv.invoiceNo, remaining })}>
                              <DollarSign className="w-3 h-3 mr-1" />Record Payment
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* New Invoice Dialog */}
        <Dialog open={newInvoice} onOpenChange={setNewInvoice}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              {/* Seeker search */}
              <div className="space-y-1.5">
                <Label>Student</Label>
                {selectedSeeker ? (
                  <div className="flex items-center gap-2 p-2 border rounded-lg bg-slate-50">
                    <p className="flex-1 text-sm font-medium">{selectedSeeker.fullName}</p>
                    <button onClick={() => setSelectedSeeker(null)}><X className="w-4 h-4 text-slate-400" /></button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input placeholder="Search student by name..." value={seekerSearch} onChange={(e) => { setSeekerSearch(e.target.value); searchSeekers(e.target.value) }} />
                    {seekerResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {seekerResults.map((s: any) => (
                          <button key={s.id} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
                            onClick={() => { setSelectedSeeker(s); setSeekerSearch(''); setSeekerResults([]) }}>
                            {s.fullName} {s.email && <span className="text-slate-400 text-xs">— {s.email}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="space-y-2">
                <Label>Items</Label>
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <Input className="col-span-6" placeholder="Description" value={item.description} onChange={(e) => { const n = [...items]; n[idx].description = e.target.value; setItems(n) }} />
                    <Input className="col-span-2" type="number" placeholder="Qty" value={item.qty} onChange={(e) => { const n = [...items]; n[idx].qty = Number(e.target.value); setItems(n) }} min={1} />
                    <Input className="col-span-3" type="number" placeholder="Unit Price" value={item.unitPrice} onChange={(e) => { const n = [...items]; n[idx].unitPrice = Number(e.target.value); setItems(n) }} min={0} />
                    <button className="col-span-1 flex items-center justify-center text-red-400 hover:text-red-600" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setItems([...items, { description: '', qty: 1, unitPrice: 0 }])}>
                  <Plus className="w-4 h-4 mr-1" />Add Item
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Discount (LKR)</Label>
                  <Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} min={0} />
                </div>
                <div className="space-y-1.5">
                  <Label>Due Date</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea placeholder="Internal notes..." value={invoiceNotes} onChange={(e) => setInvoiceNotes(e.target.value)} rows={2} />
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm text-slate-600"><span>Subtotal:</span><span>LKR {subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm text-slate-600"><span>Discount:</span><span>-LKR {discount.toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-slate-800 dark:text-white"><span>Total:</span><span>LKR {total.toLocaleString()}</span></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewInvoice(false)}>Cancel</Button>
              <Button onClick={createInvoice} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Invoice'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Record Payment Dialog */}
        <Dialog open={payDialog.open} onOpenChange={(o) => setPayDialog((d) => ({ ...d, open: o }))}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Record Payment — {payDialog.invoiceNo}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-slate-600">Remaining: <strong>LKR {payDialog.remaining.toLocaleString()}</strong></p>
              <div className="space-y-1.5">
                <Label>Amount (LKR)</Label>
                <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} max={payDialog.remaining} />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="ONLINE">Online</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Reference # (optional)</Label>
                <Input placeholder="Transaction ID, cheque #..." value={payRef} onChange={(e) => setPayRef(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayDialog((d) => ({ ...d, open: false }))}>Cancel</Button>
              <Button onClick={recordPayment} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
                {isSubmitting ? 'Recording...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
