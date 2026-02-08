'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, UserCircle, Package, CheckSquare, RefreshCw, Save, X, Calendar, Check, CheckCircle2, ListFilter } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

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
                fetch('/api/manage-tasks'),
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
                <div className="empty-state min-h-[50vh] flex flex-col items-center justify-center">
                    <div className="empty-state-icon">
                        <Check size={48} />
                    </div>
                    <div className="empty-state-text">
                        {filter === 'all' ? 'All work complete!' : `No ${filter === 'in_progress' ? 'in progress' : 'completed'} work`}
                    </div>
                    <div className="text-slate-500 text-sm">{t('noData')}</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredItems.map(item => (
                        <Card
                            key={item.entry.id}
                            className="bg-slate-900/50 border-slate-800 hover:border-emerald-500/50 transition-all duration-300 group relative overflow-hidden h-full flex flex-col"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                            <CardContent className="p-3 md:p-5 flex flex-col h-full relative z-10 box-border">
                                {/* Header Section */}
                                <div className="flex md:flex-col items-start md:items-center justify-between md:justify-center w-full mb-3 md:mb-4">
                                    <div className="flex md:flex-col items-center gap-3 md:gap-4 flex-1 min-w-0 md:text-center md:w-full">
                                        {/* Avatar */}
                                        <div className="relative shrink-0">
                                            <div className="h-10 w-10 md:h-20 md:w-20 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 shadow-md border border-slate-700 group-hover:border-emerald-500/30 transition-colors">
                                                <UserCircle size={20} className="md:w-10 md:h-10" />
                                            </div>
                                            <div className="absolute -bottom-0.5 -right-0.5 md:bottom-1 md:right-1 h-3 w-3 md:h-5 md:w-5 bg-emerald-500 rounded-full border-2 border-slate-900" />
                                        </div>

                                        {/* Worker Info */}
                                        <div className="md:w-full min-w-0">
                                            <div className="font-bold text-white text-base md:text-xl leading-tight truncate px-1">
                                                {item.entry.workers?.name}
                                            </div>
                                            <div className="text-xs md:text-sm text-slate-400 flex items-center md:justify-center gap-1 mt-0.5 md:mt-1">
                                                <Calendar size={12} className="md:w-3.5 md:h-3.5" /> {new Date(item.entry.entry_date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quantity (Mobile: Right, Desktop: Below Name or Separate) */}
                                    <div className="text-right md:hidden shrink-0 ml-2">
                                        <div className="text-xl font-bold text-emerald-400 leading-none">
                                            {item.entry.quantity}
                                        </div>
                                        <div className="text-[10px] text-slate-500 uppercase font-bold mt-0.5">Qty</div>
                                    </div>
                                </div>

                                {/* Desktop Quantity & Status Section */}
                                <div className="hidden md:flex flex-col items-center justify-center mb-4 w-full">
                                    <div className="text-3xl font-bold text-emerald-400 leading-none mb-1">
                                        {item.entry.quantity}
                                    </div>
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-3">Quantity</div>

                                    {/* Status Badge Desktop */}
                                    <div className="mb-2">
                                        {item.entry.status === 'completed' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-medium">
                                                <CheckCircle2 size={14} /> {t('completed')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-sm font-medium">
                                                <Clock size={14} /> {t('inProgress')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Mobile Status & Tasks Block */}
                                <div className="bg-slate-950/30 rounded-lg p-2.5 mb-3 border border-slate-800/30 w-full flex-grow">
                                    <div className="flex flex-wrap gap-2 mb-2 md:justify-center">
                                        {/* Status Badge (Mobile Only) */}
                                        <div className="md:hidden">
                                            {item.entry.status === 'completed' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                                                    <CheckCircle2 size={12} /> {t('completed')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium">
                                                    <Clock size={12} /> {t('inProgress')}
                                                </span>
                                            )}
                                        </div>

                                        {/* Task progress summary */}
                                        {item.remainingTasks.length > 0 ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 text-xs md:text-sm">
                                                <Clock size={12} /> {item.remainingTasks.length} remaining
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 text-xs md:text-sm">
                                                <Check size={12} /> All tasks done
                                            </span>
                                        )}
                                    </div>

                                    {item.remainingTasks.length > 0 && (
                                        <div className="flex flex-wrap gap-1 md:justify-center">
                                            {item.remainingTasks.map(task => (
                                                <span key={task.id} className="text-[10px] md:text-xs bg-amber-500/10 text-amber-500/80 border border-amber-500/10 px-1.5 py-0.5 rounded">
                                                    {task.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 w-full mt-auto">
                                    {/* Status Toggle Button */}
                                    {item.entry.status === 'in_progress' ? (
                                        <Button
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-9 md:h-10 text-xs md:text-sm"
                                            onClick={() => handleStatusChange(item.entry.id, 'completed')}
                                        >
                                            <CheckCircle2 size={16} className="mr-1.5" /> <span className="truncate">{t('markComplete')}</span>
                                        </Button>
                                    ) : (
                                        <Button
                                            className="flex-1 bg-amber-600 hover:bg-amber-700 h-9 md:h-10 text-xs md:text-sm"
                                            onClick={() => handleStatusChange(item.entry.id, 'in_progress')}
                                        >
                                            <Clock size={16} className="mr-1.5" /> <span className="truncate">{t('markInProgress')}</span>
                                        </Button>
                                    )}

                                    {/* Reassign Button - only show if remaining tasks */}
                                    {item.remainingTasks.length > 0 && (
                                        <Button
                                            className="flex-shrink-0 w-9 px-0 md:w-10 bg-blue-600 hover:bg-blue-700 h-9 md:h-10"
                                            onClick={() => openReassign(item)}
                                            title={t('reassign')}
                                        >
                                            <RefreshCw size={16} className="md:w-[18px] md:h-[18px]" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Reassign Modal */}
            <Modal
                isOpen={!!showReassign}
                onClose={() => setShowReassign(null)}
                title={
                    <>
                        <RefreshCw size={20} className="text-blue-400" /> {t('reassign')}
                    </>
                }
            >
                <div className="space-y-4">
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
                            {/* Filter out current worker effectively */}
                            {workers.filter(w => showReassign && w.id !== showReassign.entry.worker_id).map(w => (
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
                            {showReassign?.remainingTasks.map(task => (
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
            </Modal>
        </div>
    )
}
