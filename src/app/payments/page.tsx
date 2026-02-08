'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Wallet, UserCircle, Calendar, ChevronDown, ChevronUp, Coins, IndianRupee, CheckCircle2, Package, Clock } from 'lucide-react'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'

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
    upcoming_total: number
    upcoming_entries: number
    upcoming_details: PaymentDetail[]
}

export default function PaymentsPage() {
    const { t } = useLanguage()
    const [payments, setPayments] = useState<WorkerPayment[]>([])
    const [grandTotal, setGrandTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [expandedWorker, setExpandedWorker] = useState<string | null>(null)
    const [expandedUpcomingWorker, setExpandedUpcomingWorker] = useState<string | null>(null)

    // Modal state
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null)

    useEffect(() => {
        fetchPayments()
    }, [])

    async function fetchPayments() {
        setLoading(true)
        try {
            const res = await fetch('/api/worker-payments')
            if (res.ok) {
                const data = await res.json()
                setPayments(data.payments || [])
                setGrandTotal(data.grandTotal || 0)
            } else {
                const err = await res.json()
                toast.error(err.error || t('failedLoadPayments'))
            }
        } catch {
            toast.error(t('failedLoadPayments'))
        }
        setLoading(false)
    }

    function toggleExpand(workerId: string) {
        setExpandedWorker(expandedWorker === workerId ? null : workerId)
    }

    function toggleUpcomingExpand(workerId: string) {
        setExpandedUpcomingWorker(expandedUpcomingWorker === workerId ? null : workerId)
    }

    function initiatePayment(workerId: string) {
        setSelectedWorkerId(workerId)
        setModalOpen(true)
    }

    async function handleConfirmPayment() {
        if (!selectedWorkerId) return

        try {
            const res = await fetch('/api/worker-payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ worker_id: selectedWorkerId })
            })

            if (res.ok) {
                toast.success(t('paidSuccessfully'))
                fetchPayments()
            } else {
                toast.error(t('failedMarkPaid'))
            }
        } catch {
            toast.error(t('failedMarkPaid'))
        } finally {
            setModalOpen(false)
            setSelectedWorkerId(null)
        }
    }

    // Filter payments that have actual completed work details
    const payableWorkers = payments.filter(p => p.entries > 0)
    // Filter payments that have upcoming work
    const upcomingWorkers = payments.filter(p => p.upcoming_entries > 0)

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
                {t('showingStatus').split('completed')[0]}
                <span className="text-emerald-400 font-semibold">{t('completed').toLowerCase()}</span>
                {t('showingStatus').split('completed')[1]?.split('upcoming')[0]}
                <span className="text-amber-400 font-semibold">{t('upcoming').toLowerCase().split('(')[0].trim()}</span>
                {t('showingStatus').split('upcoming')[1]}
            </div>

            {/* Grand Total */}
            <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 shadow-2xl border border-emerald-500/20 p-6 sm:p-8">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute bottom-0 left-0 -ml-8 -mb-8 h-32 w-32 rounded-full bg-black/10 blur-2xl" />

                <div className="relative z-10 flex flex-col items-center justify-center text-center">
                    <div className="text-emerald-100/80 text-sm font-medium uppercase tracking-wider mb-2">{t('totalAmount')}</div>
                    <div className="flex items-center gap-1 text-4xl sm:text-5xl font-bold text-white tracking-tight">
                        <IndianRupee size={32} className="text-emerald-200" />
                        {grandTotal.toFixed(2)}
                    </div>
                    <div className="mt-4 inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-emerald-50backdrop-blur-sm border border-white/10">
                        <Wallet size={12} className="mr-1.5" /> {t('pendingPayments')}
                    </div>
                </div>
            </div>

            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                <Coins size={20} className="text-emerald-400" /> {t('workerPayments')}
            </h2>

            {/* Payments List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="bg-slate-900/50 border-slate-800">
                            <CardContent className="p-4">
                                <Skeleton className="h-6 w-32 mb-2 bg-slate-800" />
                                <Skeleton className="h-8 w-24 bg-slate-800" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Payable Section */}
                    <div className="space-y-3">
                        {payableWorkers.length > 0 ? (
                            payableWorkers.map(payment => (
                                <Card key={payment.worker_id} className="bg-slate-900/50 border-slate-800 overflow-hidden hover:border-slate-700 transition-colors">
                                    <CardContent className="p-0">
                                        {/* Worker Header - Clickable */}
                                        <div
                                            className="p-4 sm:p-5 flex justify-between items-center cursor-pointer hover:bg-slate-800/30 transition-colors"
                                            onClick={() => toggleExpand(payment.worker_id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700">
                                                    <UserCircle size={24} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-lg">{payment.worker_name}</div>
                                                    <div className="text-sm text-slate-400 flex items-center gap-1.5 font-medium">
                                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                                        {payment.entries} {t('completedEntries')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col items-end">
                                                    <div className="text-sm text-slate-500 font-medium uppercase">{t('all')}</div>
                                                    <div className="flex items-center gap-0.5 text-xl font-bold text-emerald-400">
                                                        <IndianRupee size={18} />
                                                        {payment.total.toFixed(2)}
                                                    </div>
                                                </div>
                                                <div className={`p-1 rounded-full transition-transform duration-300 ${expandedWorker === payment.worker_id ? 'rotate-180 bg-slate-800' : ''}`}>
                                                    <ChevronDown size={20} className="text-slate-400" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {expandedWorker === payment.worker_id && (
                                            <div className="border-t border-slate-800 bg-slate-900/30 animate-in slide-in-from-top-2 duration-200">
                                                <div className="p-4 space-y-3">
                                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">{t('breakdown')}</div>
                                                    {payment.details.map((detail, index) => (
                                                        <div key={detail.entry_id} className="bg-slate-950/30 rounded-xl p-3 border border-slate-800/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                            <div className="flex items-start gap-3">
                                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-400 border border-slate-700">
                                                                    {index + 1}
                                                                </span>
                                                                <div>
                                                                    <div className="flex items-center gap-2 text-sm text-slate-300 mb-1">
                                                                        <Calendar size={14} className="text-slate-500" />
                                                                        {new Date(detail.entry_date).toLocaleDateString()}
                                                                    </div>
                                                                    <div className="text-xs text-slate-500">
                                                                        {detail.tasks.join(', ')}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between sm:justify-end gap-4 pl-9 sm:pl-0 mt-1 sm:mt-0">
                                                                <div className="flex items-center gap-1.5 text-sm text-slate-400 bg-slate-900 px-2 py-1 rounded">
                                                                    <Package size={14} />
                                                                    {detail.quantity}
                                                                </div>
                                                                <div className="font-bold text-white flex items-center">
                                                                    <IndianRupee size={14} className="mr-0.5 text-slate-500" />
                                                                    {detail.amount.toFixed(2)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="p-4 pt-0">
                                                    <Button
                                                        className="h-12 w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 font-semibold text-base"
                                                        onClick={() => initiatePayment(payment.worker_id)}
                                                    >
                                                        <CheckCircle2 size={20} className="mr-2" />
                                                        {t('markPaid')} <span className="mx-1 opacity-50">|</span> ₹{payment.total.toFixed(2)}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center p-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-400 mb-3">
                                    <CheckCircle2 size={24} />
                                </div>
                                <h3 className="text-lg font-medium text-white">{t('allCaughtUp')}</h3>
                                <p className="text-slate-500 mt-1">{t('noCompletedPayments')}</p>
                            </div>
                        )}
                    </div>

                    {/* Upcoming Section */}
                    {upcomingWorkers.length > 0 && (
                        <div>
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-300 mt-10">
                                <Clock size={20} className="text-amber-400" /> {t('upcoming')}
                            </h2>
                            <div className="space-y-3 opacity-90">
                                {upcomingWorkers.map(payment => (
                                    <Card key={`upcoming-${payment.worker_id}`} className="bg-slate-900/30 border-slate-800/60 overflow-hidden hover:border-slate-700/60 transition-colors border-dashed">
                                        <CardContent className="p-0">
                                            <div
                                                className="p-4 sm:p-5 flex justify-between items-center cursor-pointer hover:bg-slate-800/20 transition-colors"
                                                onClick={() => toggleUpcomingExpand(payment.worker_id)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-full bg-amber-950/30 flex items-center justify-center text-amber-500 border border-amber-900/30">
                                                        <UserCircle size={24} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-200 text-lg">{payment.worker_name}</div>
                                                        <div className="text-sm text-slate-500 flex items-center gap-1.5 font-medium">
                                                            <Clock size={14} className="text-amber-500" />
                                                            {payment.upcoming_entries} {t('inProgressBadge')}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col items-end">
                                                        <div className="text-sm text-slate-600 font-medium uppercase">{t('est')}</div>
                                                        <div className="flex items-center gap-0.5 text-xl font-bold text-slate-400">
                                                            <IndianRupee size={18} />
                                                            {payment.upcoming_total.toFixed(2)}
                                                        </div>
                                                    </div>
                                                    <div className={`p-1 rounded-full transition-transform duration-300 ${expandedUpcomingWorker === payment.worker_id ? 'rotate-180 bg-slate-800' : ''}`}>
                                                        <ChevronDown size={20} className="text-slate-500" />
                                                    </div>
                                                </div>
                                            </div>

                                            {expandedUpcomingWorker === payment.worker_id && (
                                                <div className="border-t border-slate-800/50 bg-slate-950/20 animate-in slide-in-from-top-2 duration-200">
                                                    <div className="p-4 space-y-3">
                                                        {payment.upcoming_details.map((detail, index) => (
                                                            <div key={detail.entry_id} className="bg-slate-900/40 rounded-xl p-3 border border-slate-800/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                                <div className="flex items-start gap-3">
                                                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800/50 text-xs font-bold text-slate-500 border border-slate-700/50">
                                                                        {index + 1}
                                                                    </span>
                                                                    <div>
                                                                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                                                                            <Calendar size={14} className="text-slate-600" />
                                                                            {new Date(detail.entry_date).toLocaleDateString()}
                                                                        </div>
                                                                        <div className="text-xs text-slate-500">
                                                                            {detail.tasks.join(', ')}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center justify-between sm:justify-end gap-4 pl-9 sm:pl-0 mt-1 sm:mt-0">
                                                                    <div className="flex items-center gap-1.5 text-sm text-slate-500 bg-slate-900/50 px-2 py-1 rounded">
                                                                        <Package size={14} />
                                                                        {detail.quantity}
                                                                    </div>
                                                                    <div className="font-bold text-slate-400 flex items-center">
                                                                        <IndianRupee size={14} className="mr-0.5 text-slate-600" />
                                                                        {detail.amount.toFixed(2)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <ConfirmationModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={handleConfirmPayment}
                title={t('confirmPayment')}
                description={t('confirmPaymentDesc')}
                confirmLabel={t('markPaid')}
                variant="warning"
            />
        </div>
    )
}
