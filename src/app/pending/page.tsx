'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { supabase } from '@/lib/supabase'

interface Worker {
    id: string
    name: string
}

interface WorkEntry {
    id: string
    worker_id: string
    quantity: number
    tasks_completed: string
    entry_date: string
    workers?: { name: string }
}

interface PendingItem {
    entry: WorkEntry
    remainingTasks: number[]
}

const ALL_TASKS = [1, 2, 3, 4, 5, 6]

export default function PendingPage() {
    const { t } = useLanguage()
    const [workers, setWorkers] = useState<Worker[]>([])
    const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')

    // Reassign modal
    const [showReassign, setShowReassign] = useState<PendingItem | null>(null)
    const [reassignWorkerId, setReassignWorkerId] = useState('')
    const [reassignQuantity, setReassignQuantity] = useState('')
    const [reassignTasks, setReassignTasks] = useState<number[]>([])

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)

        const [workersRes, entriesRes] = await Promise.all([
            supabase.from('workers').select('*').order('name'),
            supabase.from('work_entries').select('*, workers(name)').order('entry_date', { ascending: false })
        ])

        if (workersRes.data) setWorkers(workersRes.data)

        if (entriesRes.data) {
            // Find entries with incomplete tasks
            const pending: PendingItem[] = []
            entriesRes.data.forEach(entry => {
                const completedTasks = entry.tasks_completed.split(',').map(Number).filter((n: number) => !isNaN(n))
                const remainingTasks = ALL_TASKS.filter(t => !completedTasks.includes(t))

                if (remainingTasks.length > 0) {
                    pending.push({ entry, remainingTasks })
                }
            })
            setPendingItems(pending)
        }

        setLoading(false)
    }

    function getTaskLabel(taskNum: number): string {
        const key = `task${taskNum}` as keyof typeof t
        return t(key)
    }

    function openReassign(item: PendingItem) {
        setShowReassign(item)
        setReassignWorkerId('')
        setReassignQuantity(item.entry.quantity.toString())
        setReassignTasks(item.remainingTasks)
    }

    function toggleReassignTask(taskNum: number) {
        if (reassignTasks.includes(taskNum)) {
            setReassignTasks(reassignTasks.filter(t => t !== taskNum))
        } else {
            setReassignTasks([...reassignTasks, taskNum].sort())
        }
    }

    async function handleReassign() {
        if (!showReassign || !reassignWorkerId || !reassignQuantity || reassignTasks.length === 0) {
            setMessage('Please fill all fields')
            setTimeout(() => setMessage(''), 3000)
            return
        }

        // Create new entry for the reassigned work
        const { error } = await supabase
            .from('work_entries')
            .insert({
                worker_id: reassignWorkerId,
                quantity: parseInt(reassignQuantity),
                tasks_completed: reassignTasks.join(','),
                entry_date: new Date().toISOString().split('T')[0]
            })

        if (error) {
            setMessage('Error reassigning work')
        } else {
            setMessage('Work reassigned successfully!')
            setShowReassign(null)
            fetchData()
        }
        setTimeout(() => setMessage(''), 3000)
    }

    return (
        <div>
            <div className="header">
                <h1>⏳ {t('pendingWork')}</h1>
            </div>

            {message && (
                <div className={`alert ${message.includes('Error') || message.includes('Please') ? 'alert-error' : 'alert-success'}`}>
                    {message}
                </div>
            )}

            {loading ? (
                <div className="text-center">{t('loading')}</div>
            ) : pendingItems.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">✅</div>
                    <div>{t('noData')}</div>
                </div>
            ) : (
                <div>
                    {pendingItems.map(item => (
                        <div key={item.entry.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                        👷 {item.entry.workers?.name}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                        📅 {new Date(item.entry.entry_date).toLocaleDateString()}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 600 }}>
                                        {item.entry.quantity} items
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '0.75rem' }}>
                                <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.5rem' }}>
                                    ✅ Completed: {item.entry.tasks_completed.split(',').map(t => `#${t}`).join(', ')}
                                </div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f59e0b' }}>
                                    ⏳ {t('remainingTasks')}:
                                </div>
                                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                    {item.remainingTasks.map(taskNum => (
                                        <span key={taskNum} className="badge badge-warning">
                                            {taskNum}. {getTaskLabel(taskNum)}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <button
                                className="btn btn-primary btn-block"
                                onClick={() => openReassign(item)}
                            >
                                🔄 {t('reassign')}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Reassign Modal */}
            {showReassign && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ maxWidth: '400px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
                        <h2 style={{ marginTop: 0 }}>🔄 {t('reassign')}</h2>

                        <div className="form-group">
                            <label className="form-label">{t('reassignTo')}</label>
                            <select
                                className="form-select"
                                value={reassignWorkerId}
                                onChange={(e) => setReassignWorkerId(e.target.value)}
                            >
                                <option value="">{t('selectWorker')}...</option>
                                {workers.filter(w => w.id !== showReassign.entry.worker_id).map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('quantity')}</label>
                            <input
                                type="number"
                                className="form-input"
                                value={reassignQuantity}
                                onChange={(e) => setReassignQuantity(e.target.value)}
                                min="1"
                                max={showReassign.entry.quantity}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('tasksCompleted')}</label>
                            <div className="checkbox-group">
                                {showReassign.remainingTasks.map(taskNum => (
                                    <label key={taskNum} className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={reassignTasks.includes(taskNum)}
                                            onChange={() => toggleReassignTask(taskNum)}
                                        />
                                        <span>{taskNum}. {getTaskLabel(taskNum)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className="btn btn-success btn-block"
                                onClick={handleReassign}
                            >
                                ✓ {t('save')}
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowReassign(null)}
                            >
                                {t('cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
