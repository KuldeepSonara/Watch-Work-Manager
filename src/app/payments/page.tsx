'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Wallet, UserCircle, Calendar, ChevronDown, ChevronUp, Coins, IndianRupee, CheckCircle2, Package } from 'lucide-react'

interface PaymentDetail {
    entry_id: string
    quantity: number
    entry_date: string
    tasks: string[]
    amount: number
}

interface WorkerPayment {
    worker_id: string
    worker_name: string
    total: number
    entries: number
    paid: boolean
    details: PaymentDetail[]
}

export default function PaymentsPage() {
    const { t } = useLanguage()
    const [payments, setPayments] = useState<WorkerPayment[]>([])
    const [grandTotal, setGrandTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [expandedWorker, setExpandedWorker] = useState<string | null>(null)

    useEffect(() => {
        fetchPayments()
    }, [])

    async function fetchPayments() {
        setLoading(true)
        try {
            const res = await fetch('/api/payments')
            if (res.ok) {
                const data = await res.json()
                setPayments(data.payments || [])
                setGrandTotal(data.grandTotal || 0)
            } else {
                const err = await res.json()
                toast.error(err.error || 'Failed to load payments')
            }
        } catch {
            toast.error('Failed to load payments')
        }
        setLoading(false)
    }

    function toggleExpand(workerId: string) {
        setExpandedWorker(expandedWorker === workerId ? null : workerId)
    }

    async function handleMarkAsPaid(workerId: string) {
        if (!confirm('Mark all completed work for this worker as paid?')) return

        try {
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ worker_id: workerId })
            })

            if (res.ok) {
                toast.success('Marked as paid!')
                fetchPayments()
            } else {
                toast.error('Failed to mark as paid')
            }
        } catch {
            toast.error('Failed to mark as paid')
        }
    }

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <h1>
                    <Wallet className="icon" size={28} />
                    {t('payments')}
                </h1>
            </div>

            {/* Note about completed only */}
            <div className="text-sm text-slate-400 mb-3 text-center">
                <CheckCircle2 size={14} className="inline mr-1" />
                Only showing <span className="text-emerald-400 font-semibold">completed</span> work
            </div>

            {/* Grand Total */}
            <div className="total-card">
                <div className="total-label">{t('totalAmount')}</div>
                <div className="total-amount flex items-center justify-center gap-1">
                    <IndianRupee size={32} />
                    {grandTotal.toFixed(2)}
                </div>
            </div>

            <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-white">
                <Coins size={18} /> {t('workerPayments')}
            </h2>

            {/* Payments List */}
            {loading ? (
                <div>
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="mb-2 bg-slate-900/50 border-slate-800">
                            <CardContent className="p-4">
                                <Skeleton className="h-6 w-32 mb-2 bg-slate-800" />
                                <Skeleton className="h-8 w-24 bg-slate-800" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : payments.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Wallet size={48} />
                    </div>
                    <div className="empty-state-text">No completed work to pay</div>
                    <div className="text-slate-500 text-sm">Mark work as completed first</div>
                </div>
            ) : (
                <div>
                    {payments.map(payment => (
                        <Card key={payment.worker_id} className="mb-3 bg-slate-900/50 border-slate-800 overflow-hidden">
                            <CardContent className="p-0">
                                {/* Worker Header - Clickable */}
                                <div
                                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-800/50 transition-colors"
                                    onClick={() => toggleExpand(payment.worker_id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="worker-avatar">
                                            <UserCircle size={24} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-white">{payment.worker_name}</div>
                                            <div className="text-sm text-slate-400 flex items-center gap-1">
                                                <Calendar size={12} /> {payment.entries} completed entries
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="amount-display flex items-center gap-1">
                                            <IndianRupee size={18} />
                                            {payment.total.toFixed(2)}
                                        </div>
                                        {expandedWorker === payment.worker_id
                                            ? <ChevronUp size={20} className="text-slate-400" />
                                            : <ChevronDown size={20} className="text-slate-400" />
                                        }
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedWorker === payment.worker_id && (
                                    <div className="border-t border-slate-800 bg-slate-900/80">
                                        {/* Entry Details */}
                                        <div className="p-4 space-y-3">
                                            {payment.details.map((detail, index) => (
                                                <div key={detail.entry_id} className="bg-slate-800/50 rounded-lg p-3">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-emerald-400 font-bold">{index + 1}.</span>
                                                            <span className="text-sm text-slate-400">
                                                                <Calendar size={12} className="inline mr-1" />
                                                                {new Date(detail.entry_date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <div className="text-emerald-400 font-semibold flex items-center gap-1">
                                                            <IndianRupee size={14} /> {detail.amount.toFixed(2)}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Package size={14} className="text-slate-400" />
                                                        <span className="text-white">{detail.quantity} pcs</span>
                                                        <span className="text-slate-500">×</span>
                                                        <span className="text-slate-300">{detail.tasks.join(', ')}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Mark as Paid Button */}
                                        <div className="p-4 pt-0">
                                            <Button
                                                className="big-action-btn bg-emerald-600 hover:bg-emerald-700 w-full"
                                                onClick={() => handleMarkAsPaid(payment.worker_id)}
                                            >
                                                <CheckCircle2 size={18} /> {t('markPaid')} - ₹{payment.total.toFixed(2)}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
