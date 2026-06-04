'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, CreditCard, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface Invoice {
  id: string; invoiceNumber: string; status: string; totalAmount: number; dueDate?: string; currency: string
  items: { description: string; amount: number; quantity: number }[]
  payments: { id: string; amount: number; paidAt: string; method: string }[]
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PAID: { label: 'Paid', className: 'bg-green-100 text-green-800 border-green-200' },
  PENDING: { label: 'Pending', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  OVERDUE: { label: 'Overdue', className: 'bg-red-100 text-red-800 border-red-200' },
  CANCELLED: { label: 'Cancelled', className: 'bg-slate-100 text-slate-600 border-slate-200' },
}

export default function PortalPaymentsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/portal/${token}/invoices`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setInvoices(d.data); else setError(d.error || 'Failed to load') })
      .catch(() => setError('Failed to load invoices'))
      .finally(() => setIsLoading(false))
  }, [token])

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
  if (error) return <div className="text-center text-red-500 py-12">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/portal/${token}`} className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">My Payments</h1>
          <p className="text-sm text-slate-500">View your invoices and payment history</p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
          <CreditCard className="w-12 h-12 mb-3 opacity-30" />
          <p>No invoices found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((inv) => {
            const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.PENDING
            const totalPaid = inv.payments.reduce((s, p) => s + p.amount, 0)
            const remaining = inv.totalAmount - totalPaid

            return (
              <div key={inv.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">Invoice #{inv.invoiceNumber}</p>
                    {inv.dueDate && (
                      <p className="text-xs text-slate-400 mt-0.5">Due: {format(new Date(inv.dueDate), 'dd MMM yyyy')}</p>
                    )}
                  </div>
                  <Badge className={cn('border', cfg.className)}>{cfg.label}</Badge>
                </div>

                {/* Items */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {inv.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-slate-600 dark:text-slate-400">{item.description} {item.quantity > 1 ? `×${item.quantity}` : ''}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-100">{inv.currency} {(item.amount * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{inv.currency} {inv.totalAmount.toLocaleString()}</span>
                  </div>
                  {totalPaid > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Paid</span>
                      <span>−{inv.currency} {totalPaid.toLocaleString()}</span>
                    </div>
                  )}
                  {remaining > 0 && inv.status !== 'CANCELLED' && (
                    <div className="flex justify-between text-sm font-bold border-t border-slate-200 dark:border-slate-700 pt-1.5">
                      <span className="text-slate-700 dark:text-slate-300">Balance Due</span>
                      <span className="text-red-600">{inv.currency} {remaining.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Payment history */}
                {inv.payments.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Payment History</p>
                    {inv.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" />{p.method?.replace('_', ' ')} — {format(new Date(p.paidAt), 'dd MMM yyyy')}</span>
                        <span>{inv.currency} {p.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pay Now CTA for pending invoices */}
                {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Bank Transfer Details</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Please transfer <strong>{inv.currency} {remaining.toLocaleString()}</strong> to our bank account and include invoice #{inv.invoiceNumber} in the reference.
                      Contact us after payment for verification.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
