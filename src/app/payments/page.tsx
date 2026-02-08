'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Wallet, UserCircle, Calendar, ChevronDown, ChevronUp, Coins, IndianRupee } from 'lucide-react'

interface WorkerPayment {
    worker_id: string
    worker_name: string
    total: number
    entries: number
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

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <h1>
                    <Wallet className="icon" size={28} />
                    {t('payments')}
                </h1>
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
                    <div className="empty-state-text">{t('noData')}</div>
                </div>
            ) : (
                <div>
                    {payments.map(payment => (
                        <Card key={payment.worker_id} className="mb-2 bg-slate-900/50 border-slate-800">
                            <CardContent className="p-4">
                                <div
                                    className="flex justify-between items-center cursor-pointer"
                                    onClick={() => toggleExpand(payment.worker_id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="worker-avatar">
                                            <UserCircle size={24} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-white">{payment.worker_name}</div>
                                            <div className="text-sm text-slate-400 flex items-center gap-1">
                                                <Calendar size={12} /> {payment.entries} entries
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
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
