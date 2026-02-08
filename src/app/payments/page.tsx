'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { supabase } from '@/lib/supabase'

interface TaskRate {
    task_number: number
    task_name: string
    rate: number
}

interface WorkEntry {
    id: string
    worker_id: string
    quantity: number
    tasks_completed: string
    entry_date: string
    workers?: { id: string; name: string }
}

interface WorkerPayment {
    workerId: string
    workerName: string
    totalAmount: number
    entries: {
        date: string
        quantity: number
        tasks: string
        amount: number
    }[]
}

export default function PaymentsPage() {
    const { t } = useLanguage()
    const [payments, setPayments] = useState<WorkerPayment[]>([])
    const [tasks, setTasks] = useState<TaskRate[]>([])
    const [taskRates, setTaskRates] = useState<{ [key: number]: number }>({})
    const [loading, setLoading] = useState(true)
    const [expandedWorker, setExpandedWorker] = useState<string | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)

        const [ratesRes, entriesRes] = await Promise.all([
            supabase.from('task_rates').select('task_number, task_name, rate').order('task_number'),
            supabase.from('work_entries').select('*, workers(id, name)').order('entry_date', { ascending: false })
        ])

        // Build rates map
        const ratesMap: { [key: number]: number } = {}
        const tasksList: TaskRate[] = []
        if (ratesRes.data) {
            ratesRes.data.forEach(r => {
                ratesMap[r.task_number] = r.rate
                tasksList.push(r)
            })
        }
        setTaskRates(ratesMap)
        setTasks(tasksList)

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
                const taskNums = entry.tasks_completed.split(',').map(Number).filter((n: number) => !isNaN(n))
                const taskTotal = taskNums.reduce((sum: number, taskNum: number) => sum + (ratesMap[taskNum] || 0), 0)
                const entryAmount = entry.quantity * taskTotal

                workerMap[workerId].totalAmount += entryAmount
                workerMap[workerId].entries.push({
                    date: entry.entry_date,
                    quantity: entry.quantity,
                    tasks: entry.tasks_completed,
                    amount: entryAmount
                })
            })

            // Sort by total amount descending
            const paymentList = Object.values(workerMap).sort((a, b) => b.totalAmount - a.totalAmount)
            setPayments(paymentList)
        }

        setLoading(false)
    }

    function getTaskName(taskNum: number): string {
        const task = tasks.find(t => t.task_number === taskNum)
        return task ? task.task_name : `Task ${taskNum}`
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
                                                                {entry.tasks.split(',').map(taskNum => (
                                                                    <span key={taskNum} className="badge" title={getTaskName(parseInt(taskNum))}>
                                                                        {taskNum}
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
                                    {tasks.map(task => (
                                        <tr key={task.task_number}>
                                            <td>{task.task_number}</td>
                                            <td>{task.task_name}</td>
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
