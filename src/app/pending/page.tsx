'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { supabase } from '@/lib/supabase'

interface Worker {
    id: string
    name: string
}

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
    workers?: { name: string }
    work_entry_tasks?: { task_id: string }[]
}

interface PendingItem {
    entry: WorkEntry
    completedTasks: Task[]
    remainingTasks: Task[]
}

export default function PendingPage() {
    const { t } = useLanguage()
    const [workers, setWorkers] = useState<Worker[]>([])
    const [allTasks, setAllTasks] = useState<Task[]>([])
    const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')

    // Reassign modal
    const [showReassign, setShowReassign] = useState<PendingItem | null>(null)
    const [reassignWorkerId, setReassignWorkerId] = useState('')
    const [reassignQuantity, setReassignQuantity] = useState('')
    const [reassignTasks, setReassignTasks] = useState<string[]>([])

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)

        const [workersRes, tasksRes, entriesRes] = await Promise.all([
            supabase.from('workers').select('*').order('name'),
            supabase.from('tasks').select('*').eq('is_active', true).order('sort_order'),
            supabase.from('work_entries')
                .select('*, workers(name), work_entry_tasks(task_id)')
                .order('entry_date', { ascending: false })
        ])

        if (workersRes.data) setWorkers(workersRes.data)

        const tasks = tasksRes.data || []
        setAllTasks(tasks)

        if (entriesRes.data && tasks.length > 0) {
            const allTaskIds = tasks.map(t => t.id)
            const pending: PendingItem[] = []

            entriesRes.data.forEach(entry => {
                const completedTaskIds = entry.work_entry_tasks?.map((t: { task_id: string }) => t.task_id) || []
                const remainingTaskIds = allTaskIds.filter(id => !completedTaskIds.includes(id))

                if (remainingTaskIds.length > 0) {
                    pending.push({
                        entry,
                        completedTasks: tasks.filter(t => completedTaskIds.includes(t.id)),
                        remainingTasks: tasks.filter(t => remainingTaskIds.includes(t.id))
                    })
                }
            })
            setPendingItems(pending)
        }

        setLoading(false)
    }

    function openReassign(item: PendingItem) {
        setShowReassign(item)
        setReassignWorkerId('')
        setReassignQuantity(item.entry.quantity.toString())
        setReassignTasks(item.remainingTasks.map(t => t.id))
    }

    function toggleReassignTask(taskId: string) {
        if (reassignTasks.includes(taskId)) {
            setReassignTasks(reassignTasks.filter(t => t !== taskId))
        } else {
            setReassignTasks([...reassignTasks, taskId])
        }
    }

    async function handleReassign() {
        if (!showReassign || !reassignWorkerId || !reassignQuantity || reassignTasks.length === 0) {
            setMessage('Please fill all fields')
            setTimeout(() => setMessage(''), 3000)
            return
        }

        // Create new entry
        const { data: newEntry, error } = await supabase
            .from('work_entries')
            .insert({
                worker_id: reassignWorkerId,
                quantity: parseInt(reassignQuantity),
                entry_date: new Date().toISOString().split('T')[0]
            })
            .select()
            .single()

        if (error || !newEntry) {
            setMessage('Error reassigning work')
            setTimeout(() => setMessage(''), 3000)
            return
        }

        // Insert task links
        const taskLinks = reassignTasks.map(taskId => ({
            work_entry_id: newEntry.id,
            task_id: taskId
        }))
        await supabase.from('work_entry_tasks').insert(taskLinks)

        setMessage('Work reassigned successfully!')
        setShowReassign(null)
        fetchData()
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
                                    ✅ Completed: {item.completedTasks.map(t => t.name).join(', ') || 'None'}
                                </div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f59e0b' }}>
                                    ⏳ {t('remainingTasks')}:
                                </div>
                                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                    {item.remainingTasks.map(task => (
                                        <span key={task.id} className="badge badge-warning">
                                            {task.name}
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
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('tasksCompleted')}</label>
                            <div className="checkbox-group">
                                {showReassign.remainingTasks.map(task => (
                                    <label key={task.id} className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={reassignTasks.includes(task.id)}
                                            onChange={() => toggleReassignTask(task.id)}
                                        />
                                        <span>{task.name}</span>
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
