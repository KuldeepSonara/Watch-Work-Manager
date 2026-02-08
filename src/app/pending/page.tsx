'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, UserCircle, Package, CheckSquare, RefreshCw, Save, X, Calendar, Check, CheckCircle2, ListFilter, Pencil } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useRouter } from 'next/navigation'
import api, { handleApiError } from '@/lib/api'
import { ApiEndpoints, WorkStatus } from '@/lib/enums'

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
    const router = useRouter()
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

    // Edit modal state
    const [editItem, setEditItem] = useState<PendingItem | null>(null)
    const [editWorkerId, setEditWorkerId] = useState('')
    const [editQuantity, setEditQuantity] = useState('')
    const [editTasks, setEditTasks] = useState<string[]>([])
    const [editStatus, setEditStatus] = useState<WorkStatus.IN_PROGRESS | WorkStatus.COMPLETED>(WorkStatus.IN_PROGRESS)
    const [editDate, setEditDate] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        try {
            const [workersRes, tasksRes, entriesRes] = await Promise.all([
                api.get(ApiEndpoints.WORKERS),
                api.get(ApiEndpoints.TASKS_MANAGEMENT),
                api.get(ApiEndpoints.ENTRIES)
            ])

            setWorkers(workersRes.data)

            const tasks = tasksRes.data
            setAllTasks(tasks)

            if (tasks.length > 0) {
                const entries: WorkEntry[] = entriesRes.data
                const allTaskIds = tasks.map((t: Task) => t.id)
                const pending: PendingItem[] = []

                entries.forEach(entry => {
                    const completedTaskIds = entry.work_entry_tasks?.map(t => t.task_id) || []
                    const remainingTaskIds = allTaskIds.filter((id: string) => !completedTaskIds.includes(id))

                    // Show entries with remaining tasks OR in_progress status
                    if (remainingTaskIds.length > 0 || entry.status === WorkStatus.IN_PROGRESS) {
                        pending.push({
                            entry,
                            completedTasks: tasks.filter((t: Task) => completedTaskIds.includes(t.id)),
                            remainingTasks: tasks.filter((t: Task) => remainingTaskIds.includes(t.id))
                        })
                    }
                })
                setPendingItems(pending)
            }
        } catch (error) {
            toast.error(handleApiError(error, t('failedLoadData')))
        }
        setLoading(false)
    }

    function openReassign(item: PendingItem) {
        setShowReassign(item)
        setReassignWorkerId('')
        setReassignQuantity(item.entry.quantity.toString())
        setReassignTasks(item.remainingTasks.map(t => t.id))
    }

    function getTaskName(taskId: string): string {
        const task = allTasks.find(t => t.id === taskId)
        return task ? task.name : 'Unknown'
    }

    function calculateEntryPrice(item: PendingItem): number {
        let total = 0
        item.completedTasks.forEach(task => {
            total += task.rate * item.entry.quantity
        })
        return total
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
            toast.error(t('fillAllFields'))
            return
        }

        try {
            await api.post(ApiEndpoints.ENTRIES, {
                worker_id: reassignWorkerId,
                quantity: parseInt(reassignQuantity),
                entry_date: new Date().toISOString().split('T')[0],
                status: WorkStatus.IN_PROGRESS,
                task_ids: reassignTasks
            })

            toast.success(t('workReassigned'))
            setShowReassign(null)
            fetchData()
        } catch (error) {
            toast.error(handleApiError(error, t('failedReassign')))
        }
    }

    // Change status of an entry
    async function handleStatusChange(entryId: string, newStatus: WorkStatus.IN_PROGRESS | WorkStatus.COMPLETED) {
        try {
            await api.patch(`${ApiEndpoints.ENTRIES}/${entryId}`, { status: newStatus })
            toast.success(newStatus === WorkStatus.COMPLETED ? t('markedComplete') : t('markedInProgress'))
            fetchData()
        } catch (error) {
            toast.error(handleApiError(error, t('failedUpdateStatus')))
        }
    }

    // Open Edit modal
    function openEditModal(item: PendingItem) {
        setEditItem(item)
        setEditWorkerId(item.entry.worker_id)
        setEditQuantity(item.entry.quantity.toString())
        setEditTasks(item.entry.work_entry_tasks?.map(t => t.task_id) || [])
        setEditStatus((item.entry.status as WorkStatus.IN_PROGRESS | WorkStatus.COMPLETED) || WorkStatus.IN_PROGRESS)
        setEditDate(item.entry.entry_date)
    }

    function toggleEditTask(taskId: string) {
        if (editTasks.includes(taskId)) {
            setEditTasks(editTasks.filter(t => t !== taskId))
        } else {
            setEditTasks([...editTasks, taskId])
        }
    }

    async function handleEditSave() {
        if (!editItem || !editWorkerId || !editQuantity || editTasks.length === 0) {
            toast.error(t('fillAllFields'))
            return
        }

        try {
            await api.put(`${ApiEndpoints.ENTRIES}/${editItem.entry.id}`, {
                worker_id: editWorkerId,
                quantity: parseInt(editQuantity),
                entry_date: editDate,
                status: editStatus,
                task_ids: editTasks
            })

            toast.success(t('entrySaved'))
            setEditItem(null)
            fetchData()
        } catch (error) {
            toast.error(handleApiError(error, t('failedSaveEntry')))
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
                    <ListFilter size={16} className="inline mr-1" /> {t('all')} ({pendingItems.length})
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="bg-slate-900/50 border-slate-800 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-slate-700 animate-pulse" />
                            <CardContent className="p-4 pl-5">
                                {/* Header Row */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-11 w-11 rounded-full bg-slate-800" />
                                        <div>
                                            <Skeleton className="h-4 w-28 mb-1.5 bg-slate-800" />
                                            <Skeleton className="h-3 w-20 bg-slate-800" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-12 w-16 rounded-lg bg-slate-800" />
                                </div>
                                {/* Badges */}
                                <div className="flex gap-2 mb-3">
                                    <Skeleton className="h-6 w-20 rounded-full bg-slate-800" />
                                    <Skeleton className="h-6 w-24 rounded-full bg-slate-800" />
                                </div>
                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-2 border-t border-slate-800/50">
                                    <Skeleton className="h-9 flex-1 rounded-md bg-slate-800" />
                                    <Skeleton className="h-9 w-9 rounded-md bg-slate-800" />
                                </div>
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
                        {filter === 'all' ? t('allWorkComplete') : (filter === 'in_progress' ? t('noInProgressWork') : t('noCompletedWork'))}
                    </div>
                    <div className="text-slate-500 text-sm">{t('noData')}</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredItems.map(item => (
                        <Card
                            key={item.entry.id}
                            className="bg-slate-900/50 border-slate-800 hover:border-emerald-500/30 transition-all duration-300 group relative overflow-hidden"
                        >
                            {/* Status indicator bar */}
                            <div className={`absolute top-0 left-0 w-1 h-full ${item.entry.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                                }`} />

                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                            <CardContent className="p-4 pl-5 flex flex-col relative z-10">
                                {/* Top Row: Worker Info + Quantity/Price */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    {/* Left: Avatar & Worker */}
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="relative shrink-0">
                                            <div className={`h-11 w-11 rounded-full flex items-center justify-center border-2 transition-colors ${item.entry.status === 'completed'
                                                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                                : 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                                                }`}>
                                                <UserCircle size={22} />
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-white text-sm leading-tight truncate">
                                                {item.entry.workers?.name}
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                <Calendar size={11} />
                                                {new Date(item.entry.entry_date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Quantity & Price */}
                                    <div className="text-right shrink-0 bg-slate-800/50 rounded-lg px-3 py-1.5 border border-slate-700/50">
                                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">{t('quantity')}</div>
                                        <div className="text-lg font-bold text-white leading-none flex items-center justify-end gap-1">
                                            <Package size={14} className="text-emerald-500" />
                                            {item.entry.quantity}
                                        </div>
                                        <div className="text-xs font-medium text-emerald-400 mt-1">₹{calculateEntryPrice(item).toLocaleString()}</div>
                                    </div>
                                </div>

                                {/* Status Row */}
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {item.entry.status === 'completed' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium">
                                            <CheckCircle2 size={12} /> {t('completed')}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-medium">
                                            <Clock size={12} /> {t('inProgress')}
                                        </span>
                                    )}
                                </div>

                                {/* Assigned Tasks */}
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {item.entry.work_entry_tasks?.map(wt => (
                                        <span
                                            key={wt.task_id}
                                            className={`text-[11px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${item.entry.status === 'completed'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}
                                        >
                                            {item.entry.status === 'completed' ? <Check size={10} /> : <Clock size={10} />}
                                            {getTaskName(wt.task_id)}
                                        </span>
                                    ))}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 w-full mt-auto pt-2 border-t border-slate-800/50">
                                    {item.entry.status === WorkStatus.IN_PROGRESS ? (
                                        <Button
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 h-9 text-xs font-medium shadow-lg shadow-emerald-900/20"
                                            onClick={() => handleStatusChange(item.entry.id, WorkStatus.COMPLETED)}
                                        >
                                            <CheckCircle2 size={15} className="mr-1.5" /> {t('markComplete')}
                                        </Button>
                                    ) : (
                                        <Button
                                            className="flex-1 bg-amber-600 hover:bg-amber-500 h-9 text-xs font-medium"
                                            onClick={() => handleStatusChange(item.entry.id, WorkStatus.IN_PROGRESS)}
                                        >
                                            <Clock size={15} className="mr-1.5" /> {t('markInProgress')}
                                        </Button>
                                    )}

                                    {item.remainingTasks.length > 0 && (
                                        <Button
                                            className="w-9 px-0 bg-blue-600 hover:bg-blue-500 h-9"
                                            onClick={() => openReassign(item)}
                                            title={t('reassign')}
                                        >
                                            <RefreshCw size={15} />
                                        </Button>
                                    )}

                                    <button
                                        className="w-9 h-9 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700"
                                        onClick={() => openEditModal(item)}
                                        title={t('edit')}
                                    >
                                        <Pencil size={14} />
                                    </button>
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

            {/* Edit Modal */}
            <Modal
                isOpen={!!editItem}
                onClose={() => setEditItem(null)}
                title={
                    <>
                        <Pencil size={20} className="text-emerald-400" /> {t('edit')}
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="form-group">
                        <label className="form-label">
                            <UserCircle size={18} /> {t('worker')}
                        </label>
                        <select
                            className="large-select bg-slate-800 border-slate-700"
                            value={editWorkerId}
                            onChange={(e) => setEditWorkerId(e.target.value)}
                        >
                            <option value="">{t('selectWorker')}...</option>
                            {workers.map(w => (
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
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            min="1"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <Calendar size={18} /> {t('date')}
                        </label>
                        <Input
                            type="date"
                            className="large-input bg-slate-800 border-slate-700"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <Clock size={18} /> {t('status')}
                        </label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className={`flex-1 py-2 px-3 rounded-lg border transition-colors flex items-center justify-center gap-2 ${editStatus === WorkStatus.IN_PROGRESS
                                    ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                    }`}
                                onClick={() => setEditStatus(WorkStatus.IN_PROGRESS)}
                            >
                                <Clock size={16} /> {t('inProgress')}
                            </button>
                            <button
                                type="button"
                                className={`flex-1 py-2 px-3 rounded-lg border transition-colors flex items-center justify-center gap-2 ${editStatus === WorkStatus.COMPLETED
                                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                    }`}
                                onClick={() => setEditStatus(WorkStatus.COMPLETED)}
                            >
                                <CheckCircle2 size={16} /> {t('completed')}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <CheckSquare size={18} /> {t('tasksCompleted')}
                        </label>
                        <div className="checkbox-grid">
                            {allTasks.map(task => (
                                <div
                                    key={task.id}
                                    className={`checkbox-item ${editTasks.includes(task.id) ? 'selected' : ''}`}
                                    onClick={() => toggleEditTask(task.id)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={editTasks.includes(task.id)}
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
                            onClick={handleEditSave}
                        >
                            <Save size={18} /> {t('save')}
                        </Button>
                        <Button
                            variant="secondary"
                            className="big-action-btn bg-slate-700 hover:bg-slate-600"
                            onClick={() => setEditItem(null)}
                        >
                            <X size={18} /> {t('cancel')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
