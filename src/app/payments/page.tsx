'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Wallet, UserCircle, Calendar, ChevronDown, ChevronUp, Coins, IndianRupee } from 'lucide-react'

interface Task {
    id: string
    name: string
    rate: number
    sort_order: number
}

interface WorkEntry {
    id: string
    worker_id: string
    quantity: number
    entry_date: string
    workers?: { id: string; name: string }
    work_entry_tasks?: { task_id: string }[]
}

interface WorkerPayment {
    workerId: string
    workerName: string
    totalAmount: number
    entries: {
        date: string
        quantity: number
        taskNames: string[]
        amount: number
    }[]
}

export default function PaymentsPage() {
    const { t } = useLanguage()
    const [payments, setPayments] = useState<WorkerPayment[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedWorker, setExpandedWorker] = useState<string | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)

        const [tasksRes, entriesRes] = await Promise.all([
            supabase.from('tasks').select('*').eq('is_active', true).order('sort_order'),
            supabase.from('work_entries')
                .select('*, workers(id, name), work_entry_tasks(task_id)')
                .order('entry_date', { ascending: false })
        ])

        const tasksList = tasksRes.data || []
        setTasks(tasksList)

        const taskMap: { [key: string]: Task } = {}
        tasksList.forEach(t => { taskMap[t.id] = t })

        if (entriesRes.data) {
            const workerMap: { [key: string]: WorkerPayment } = {}

            entriesRes.data.forEach(entry => {
                if (!entry.workers) return

                const workerId = entry.workers.id
                const workerName = entry.workers.name

                if (!workerMap[workerId]) {
                    workerMap[workerId] = {
                        workerId,
                        workerName,
                        totalAmount: 0,
                        entries: []
                    }
                }

                const entryTasks = entry.work_entry_tasks || []
                let taskTotal = 0
                const taskNames: string[] = []

                entryTasks.forEach((et: { task_id: string }) => {
                    const task = taskMap[et.task_id]
                    if (task) {
                        taskTotal += task.rate
                        taskNames.push(task.name)
                    }
                })

                const entryAmount = entry.quantity * taskTotal

                workerMap[workerId].totalAmount += entryAmount
                workerMap[workerId].entries.push({
                    date: entry.entry_date,
                    quantity: entry.quantity,
                    taskNames,
                    amount: entryAmount
                })
            })

            const paymentList = Object.values(workerMap).sort((a, b) => b.totalAmount - a.totalAmount)
            setPayments(paymentList)
        }

        setLoading(false)
    }

    const grandTotal = payments.reduce((sum, p) => sum + p.totalAmount, 0)

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
                <div className="total-amount">
                    ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
            </div>

            <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-white">
                <UserCircle size={18} /> {t('workerPayments')}
            </h2>

            {loading ? (
                <div>
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="mb-2 bg-slate-900/50 border-slate-800">
                            <CardContent className="p-4 flex justify-between items-center">
                                <div>
                                    <Skeleton className="h-5 w-32 mb-2 bg-slate-800" />
                                    <Skeleton className="h-4 w-20 bg-slate-800" />
                                </div>
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
                    {payments.map(worker => (
                        <Card key={worker.workerId} className="mb-2 bg-slate-900/50 border-slate-800">
                            <CardContent className="p-4">
                                <div
                                    className="flex justify-between items-center cursor-pointer"
                                    onClick={() => setExpandedWorker(
                                        expandedWorker === worker.workerId ? null : worker.workerId
                                    )}
                                >
                                    <div>
                                        <div className="font-semibold text-base flex items-center gap-2 text-white">
                                            <UserCircle size={18} className="text-emerald-400" /> {worker.workerName}
                                        </div>
                                        <div className="text-sm text-slate-400">
                                            {worker.entries.length} entries
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-2">
                                        <div className="amount-display">
                                            ₹{worker.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </div>
                                        {expandedWorker === worker.workerId
                                            ? <ChevronUp size={20} className="text-slate-400" />
                                            : <ChevronDown size={20} className="text-slate-400" />
                                        }
                                    </div>
                                </div>

                                {expandedWorker === worker.workerId && (
                                    <div className="mt-3 pt-3 border-t border-slate-700">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-slate-400">
                                                    <th className="pb-2"><Calendar size={12} className="inline" /></th>
                                                    <th className="pb-2">Qty</th>
                                                    <th className="pb-2">Tasks</th>
                                                    <th className="pb-2 text-right"><IndianRupee size={12} className="inline" /></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {worker.entries.map((entry, idx) => (
                                                    <tr key={idx} className="border-t border-slate-800">
                                                        <td className="py-2 text-slate-300">{new Date(entry.date).toLocaleDateString()}</td>
                                                        <td className="py-2 text-slate-300">{entry.quantity}</td>
                                                        <td className="py-2">
                                                            <div className="flex flex-wrap gap-1">
                                                                {entry.taskNames.map((name, i) => (
                                                                    <span key={i} className="entry-task-badge text-xs">
                                                                        {name.substring(0, 8)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="py-2 text-right font-semibold text-emerald-400">
                                                            ₹{entry.amount.toLocaleString('en-IN')}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Task Rates Reference */}
            {tasks.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-white">
                        <Coins size={18} /> {t('rates')}
                    </h3>
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-slate-400">
                                        <th className="pb-2">#</th>
                                        <th className="pb-2">{t('taskName')}</th>
                                        <th className="pb-2 text-right">{t('ratePerItem')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.map((task, index) => (
                                        <tr key={task.id} className="border-t border-slate-800">
                                            <td className="py-2 text-slate-400">{index + 1}</td>
                                            <td className="py-2 text-white">{task.name}</td>
                                            <td className="py-2 text-right font-semibold text-emerald-400">₹{task.rate.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
