'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, UserCircle, Package, CheckSquare, RefreshCw, Save, X, Calendar, Check, CheckCircle2, ListFilter } from 'lucide-react'

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
    status: string
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
    const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all')

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
        try {
            const [workersRes, tasksRes, entriesRes] = await Promise.all([
                fetch('/api/workers'),
                fetch('/api/tasks'),
                fetch('/api/entries')
            ])

            if (workersRes.ok) setWorkers(await workersRes.json())

            const tasks = tasksRes.ok ? await tasksRes.json() : []
            setAllTasks(tasks)

            if (entriesRes.ok && tasks.length > 0) {
                const entries: WorkEntry[] = await entriesRes.json()
                const allTaskIds = tasks.map((t: Task) => t.id)
                const pending: PendingItem[] = []

                entries.forEach(entry => {
                    const completedTaskIds = entry.work_entry_tasks?.map(t => t.task_id) || []
                    const remainingTaskIds = allTaskIds.filter((id: string) => !completedTaskIds.includes(id))

                    // Show entries with remaining tasks OR in_progress status
                    if (remainingTaskIds.length > 0 || entry.status === 'in_progress') {
                        pending.push({
                            entry,
                            completedTasks: tasks.filter((t: Task) => completedTaskIds.includes(t.id)),
                            remainingTasks: tasks.filter((t: Task) => remainingTaskIds.includes(t.id))
                        })
                    }
                })
                setPendingItems(pending)
            }
        } catch {
            toast.error('Failed to load data')
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
            toast.error('Please fill all fields')
            return
        }

        try {
            const res = await fetch('/api/entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    worker_id: reassignWorkerId,
                    quantity: parseInt(reassignQuantity),
                    entry_date: new Date().toISOString().split('T')[0],
                    status: 'in_progress',
                    task_ids: reassignTasks
                })
            })

            if (res.ok) {
                toast.success('Work reassigned!')
                setShowReassign(null)
                fetchData()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to reassign')
            }
        } catch {
            toast.error('Failed to reassign work')
        }
    }

    // Change status of an entry
    async function handleStatusChange(entryId: string, newStatus: 'in_progress' | 'completed') {
        try {
            const res = await fetch(`/api/entries/${entryId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (res.ok) {
                toast.success(newStatus === 'completed' ? 'Marked as complete!' : 'Marked as in progress!')
                fetchData()
            } else {
                toast.error('Failed to update status')
            }
        } catch {
            toast.error('Failed to update status')
        }
    }

    // Filter items
    const filteredItems = pendingItems.filter(item => {
        if (filter === 'all') return true
        return item.entry.status === filter
    })

    const inProgressCount = pendingItems.filter(i => i.entry.status === 'in_progress').length
    const completedCount = pendingItems.filter(i => i.entry.status === 'completed').length

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <h1>
                    <Clock className="icon" size={28} />
                    {t('pendingWork')}
                </h1>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
                <button
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === 'all'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                    onClick={() => setFilter('all')}
                >
                    <ListFilter size={16} className="inline mr-1" /> All ({pendingItems.length})
                </button>
                <button
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === 'in_progress'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                    onClick={() => setFilter('in_progress')}
                >
                    <Clock size={16} className="inline mr-1" /> {t('inProgress')} ({inProgressCount})
                </button>
                <button
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === 'completed'
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                    onClick={() => setFilter('completed')}
                >
                    <CheckCircle2 size={16} className="inline mr-1" /> {t('completed')} ({completedCount})
                </button>
            </div>

            {loading ? (
                <div>
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="mb-2 bg-slate-900/50 border-slate-800">
                            <CardContent className="p-4">
                                <Skeleton className="h-4 w-24 mb-2 bg-slate-800" />
                                <Skeleton className="h-5 w-40 mb-2 bg-slate-800" />
                                <Skeleton className="h-10 w-full bg-slate-800" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Check size={48} />
                    </div>
                    <div className="empty-state-text">
                        {filter === 'all' ? 'All work complete!' : `No ${filter === 'in_progress' ? 'in progress' : 'completed'} work`}
                    </div>
                    <div className="text-slate-500 text-sm">{t('noData')}</div>
                </div>
            ) : (
                <div>
                    {filteredItems.map(item => (
                        <Card key={item.entry.id} className="mb-3 bg-slate-900/50 border-slate-800">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="font-semibold text-base flex items-center gap-2 text-white">
                                            <UserCircle size={18} className="text-emerald-400" /> {item.entry.workers?.name}
                                        </div>
                                        <div className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                                            <Calendar size={14} /> {new Date(item.entry.entry_date).toLocaleDateString()}
                                        </div>
                                        {/* Status Badge */}
                                        <div className="mt-2">
                                            {item.entry.status === 'completed' ? (
                                                <span className="status-badge status-badge-success">
                                                    <CheckCircle2 size={14} /> {t('completed')}
                                                </span>
                                            ) : (
                                                <span className="status-badge status-badge-warning">
                                                    <Clock size={14} /> {t('inProgress')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xl font-bold text-emerald-400">
                                        {item.entry.quantity}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <div className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                                        <Check size={14} /> Done: {item.completedTasks.map(t => t.name).join(', ') || 'None'}
                                    </div>
                                    {item.remainingTasks.length > 0 && (
                                        <>
                                            <div className="text-sm font-semibold mb-1 text-amber-400 flex items-center gap-1">
                                                <Clock size={14} /> {t('remainingTasks')}:
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {item.remainingTasks.map(task => (
                                                    <span key={task.id} className="status-badge status-badge-warning">
                                                        {task.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-2">
                                    {/* Status Toggle Button */}
                                    {item.entry.status === 'in_progress' ? (
                                        <Button
                                            className="big-action-btn bg-green-600 hover:bg-green-700"
                                            onClick={() => handleStatusChange(item.entry.id, 'completed')}
                                        >
                                            <CheckCircle2 size={18} /> {t('markComplete')}
                                        </Button>
                                    ) : (
                                        <Button
                                            className="big-action-btn bg-amber-600 hover:bg-amber-700"
                                            onClick={() => handleStatusChange(item.entry.id, 'in_progress')}
                                        >
                                            <Clock size={18} /> {t('markInProgress')}
                                        </Button>
                                    )}

                                    {/* Reassign Button - only show if remaining tasks */}
                                    {item.remainingTasks.length > 0 && (
                                        <Button
                                            className="big-action-btn bg-blue-600 hover:bg-blue-700"
                                            onClick={() => openReassign(item)}
                                        >
                                            <RefreshCw size={18} /> {t('reassign')}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Reassign Modal */}
            {showReassign && (
                <div className="modal-overlay">
                    <div className="modal-content bg-slate-900 border border-slate-800">
                        <h2 className="modal-title text-white">
                            <RefreshCw size={20} className="text-blue-400" /> {t('reassign')}
                        </h2>

                        <div className="form-group">
                            <label className="form-label">
                                <UserCircle size={18} /> {t('reassignTo')}
                            </label>
                            <select
                                className="large-select bg-slate-800 border-slate-700"
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
                            <label className="form-label">
                                <Package size={18} /> {t('quantity')}
                            </label>
                            <Input
                                type="number"
                                className="large-input bg-slate-800 border-slate-700"
                                value={reassignQuantity}
                                onChange={(e) => setReassignQuantity(e.target.value)}
                                min="1"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <CheckSquare size={18} /> {t('tasksCompleted')}
                            </label>
                            <div className="checkbox-grid">
                                {showReassign.remainingTasks.map(task => (
                                    <div
                                        key={task.id}
                                        className={`checkbox-item ${reassignTasks.includes(task.id) ? 'selected' : ''}`}
                                        onClick={() => toggleReassignTask(task.id)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={reassignTasks.includes(task.id)}
                                            onChange={() => { }}
                                        />
                                        <span>{task.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="action-grid">
                            <Button
                                className="big-action-btn bg-emerald-600 hover:bg-emerald-700"
                                onClick={handleReassign}
                            >
                                <Save size={18} /> {t('save')}
                            </Button>
                            <Button
                                variant="secondary"
                                className="big-action-btn bg-slate-700 hover:bg-slate-600"
                                onClick={() => setShowReassign(null)}
                            >
                                <X size={18} /> {t('cancel')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
