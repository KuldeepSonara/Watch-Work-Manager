'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { supabase } from '@/lib/supabase'

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

        // Build task lookup map
        const taskMap: { [key: string]: Task } = {}
        tasksList.forEach(t => { taskMap[t.id] = t })

        // Calculate payments per worker
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

                // Calculate amount for this entry
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

            // Sort by total amount descending
            const paymentList = Object.values(workerMap).sort((a, b) => b.totalAmount - a.totalAmount)
            setPayments(paymentList)
        }

        setLoading(false)
    }

    const grandTotal = payments.reduce((sum, p) => sum + p.totalAmount, 0)

    return (
        <div>
            <div className="header">
                <h1>💵 {t('payments')}</h1>
            </div>

            {/* Grand Total */}
            <div className="card" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: 'white' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', textTransform: 'uppercase', opacity: 0.9 }}>
                        {t('totalAmount')}
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                        ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                </div>
            </div>

            <h2>{t('workerPayments')}</h2>

            {loading ? (
                <div className="text-center">{t('loading')}</div>
            ) : payments.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">💵</div>
                    <div>{t('noData')}</div>
                </div>
            ) : (
                <div>
                    {payments.map(worker => (
                        <div key={worker.workerId} className="card">
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setExpandedWorker(
                                    expandedWorker === worker.workerId ? null : worker.workerId
                                )}
                            >
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>
                                        👷 {worker.workerName}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                        {worker.entries.length} entries
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="amount amount-large">
                                        ₹{worker.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div style={{ fontSize: '1.25rem' }}>
                                        {expandedWorker === worker.workerId ? '▲' : '▼'}
                                    </div>
                                </div>
                            </div>

                            {expandedWorker === worker.workerId && (
                                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                    <div className="table-container">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>📅 Date</th>
                                                    <th>Qty</th>
                                                    <th>Tasks</th>
                                                    <th style={{ textAlign: 'right' }}>{t('amount')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {worker.entries.map((entry, idx) => (
                                                    <tr key={idx}>
                                                        <td>{new Date(entry.date).toLocaleDateString()}</td>
                                                        <td>{entry.quantity}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                                                {entry.taskNames.map((name, i) => (
                                                                    <span key={i} className="badge">
                                                                        {name.substring(0, 10)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <span className="amount">
                                                                ₹{entry.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Task Rates Reference */}
            {tasks.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                    <h3>📊 {t('rates')}</h3>
                    <div className="card">
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>{t('taskName')}</th>
                                        <th style={{ textAlign: 'right' }}>{t('ratePerItem')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.map((task, index) => (
                                        <tr key={task.id}>
                                            <td>{index + 1}</td>
                                            <td>{task.name}</td>
                                            <td style={{ textAlign: 'right' }}>₹{task.rate.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
