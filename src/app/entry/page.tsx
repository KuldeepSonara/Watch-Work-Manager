'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/LanguageContext'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Modal } from '@/components/ui/Modal'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { FileEdit, UserCircle, Package, Calendar, CheckSquare, Save, X, Pencil, Trash2, Clock, CheckCircle2, Plus } from 'lucide-react'
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

function EntryContent() {
    const { t } = useLanguage()
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get('edit')

    const [workers, setWorkers] = useState<Worker[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [entries, setEntries] = useState<WorkEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    // Form state
    const [workerId, setWorkerId] = useState('')
    const [quantity, setQuantity] = useState('')
    const [selectedTasks, setSelectedTasks] = useState<string[]>([])
    const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
    const [status, setStatus] = useState<WorkStatus.IN_PROGRESS | WorkStatus.COMPLETED>(WorkStatus.IN_PROGRESS)

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (editId && entries.length > 0) {
            const entry = entries.find(e => e.id === editId)
            if (entry) {
                setEditingId(entry.id)
                setWorkerId(entry.worker_id)
                setQuantity(entry.quantity.toString())
                setSelectedTasks(entry.work_entry_tasks?.map(t => t.task_id) || [])
                setEntryDate(entry.entry_date)
                setStatus((entry.status as WorkStatus.IN_PROGRESS | WorkStatus.COMPLETED) || WorkStatus.IN_PROGRESS)
                setIsAddModalOpen(true) // Open modal when editing
            }
        }
    }, [editId, entries])

    async function fetchData() {
        setLoading(true)
        try {
            const [workersRes, tasksRes, entriesRes] = await Promise.all([
                api.get(ApiEndpoints.WORKERS),
                api.get(ApiEndpoints.TASKS_MANAGEMENT),
                api.get(ApiEndpoints.ENTRIES)
            ])

            setWorkers(workersRes.data)
            setTasks(tasksRes.data)
            setEntries(entriesRes.data)
        } catch (error) {
            toast.error(handleApiError(error, 'Failed to load data'))
        }
        setLoading(false)
    }

    function toggleTask(taskId: string) {
        if (selectedTasks.includes(taskId)) {
            setSelectedTasks(selectedTasks.filter(t => t !== taskId))
        } else {
            setSelectedTasks([...selectedTasks, taskId])
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!workerId || !quantity || selectedTasks.length === 0) {
            toast.error('Please fill all fields')
            return
        }

        try {
            const body = {
                worker_id: workerId,
                quantity: parseInt(quantity),
                entry_date: entryDate,
                status: status as WorkStatus, // Ensure status is of type WorkStatus
                task_ids: selectedTasks
            }

            if (editId) {
                await api.put(`${ApiEndpoints.ENTRIES}/${editId}`, body)
            } else {
                await api.post(ApiEndpoints.ENTRIES, body)
            }

            toast.success(editId ? t('entryUpdated') : t('entrySaved'))
            if (editId) router.push('/entry')
            resetForm()
            setIsAddModalOpen(false)
            fetchData()
        } catch (error) {
            toast.error(handleApiError(error, t('failedSaveEntry')))
        }
    }

    function resetForm() {
        setWorkerId('')
        setQuantity('')
        setSelectedTasks([])
        setEntryDate(new Date().toISOString().split('T')[0])
        setStatus(WorkStatus.IN_PROGRESS)
    }

    function confirmDelete(id: string) {
        setDeleteId(id)
    }

    async function handleDelete() {
        if (!deleteId) return

        try {
            await api.delete(`${ApiEndpoints.ENTRIES}/${deleteId}`)
            toast.success(t('entryDeleted'))
            fetchData()
        } catch (error) {
            toast.error(handleApiError(error, t('failedDeleteEntry')))
        } finally {
            setDeleteId(null)
        }
    }

    function getTaskName(taskId: string): string {
        const task = tasks.find(t => t.id === taskId)
        return task ? task.name : 'Unknown'
    }

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <h1>
                    <FileEdit className="icon" size={28} />
                    {t('entry')}
                </h1>
            </div>

            {tasks.length === 0 && !loading && (
                <div className="alert alert-warning">
                    {t('noTasksWarning')}
                </div>
            )}

            {/* Add Button */}
            <Button
                className="fixed bottom-24 right-4 h-14 w-14 rounded-2xl shadow-lg bg-emerald-600 hover:bg-emerald-700 md:static md:w-full md:h-12 md:mb-4 md:shadow-none z-40"
                onClick={() => {
                    resetForm()
                    setIsAddModalOpen(true)
                }}
            >
                <Plus size={24} /> <span className="hidden md:inline ml-2">{editingId ? t('editEntry') : t('addEntry')}</span>
            </Button>

            {/* Entry Form Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={
                    <>
                        {editingId ? <Pencil size={20} className="text-emerald-400" /> : <Plus size={20} className="text-emerald-400" />}
                        {editingId ? t('editEntry') : t('addEntry')}
                    </>
                }
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">
                            <UserCircle size={18} /> {t('selectWorker')}
                        </label>
                        <select
                            className="large-select bg-slate-800 border-slate-700"
                            value={workerId}
                            onChange={(e) => setWorkerId(e.target.value)}
                            required
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
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="1000"
                            min="1"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <Calendar size={18} /> {t('entryDate')}
                        </label>
                        <Input
                            type="date"
                            className="large-input bg-slate-800 border-slate-700"
                            value={entryDate}
                            onChange={(e) => setEntryDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <Clock size={18} /> {t('status')}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div
                                className={`checkbox-item ${status === WorkStatus.IN_PROGRESS ? 'selected' : ''}`}
                                onClick={() => setStatus(WorkStatus.IN_PROGRESS)}
                            >
                                <Clock size={20} className="text-amber-400" />
                                <span>{t('inProgress')}</span>
                            </div>
                            <div
                                className={`checkbox-item ${status === WorkStatus.COMPLETED ? 'selected' : ''}`}
                                onClick={() => setStatus(WorkStatus.COMPLETED)}
                            >
                                <CheckCircle2 size={20} className="text-emerald-400" />
                                <span>{t('completed')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <CheckSquare size={18} /> {t('tasksCompleted')}
                        </label>
                        <div className="checkbox-grid">
                            {tasks.map((task, index) => (
                                <div
                                    key={task.id}
                                    className={`checkbox-item ${selectedTasks.includes(task.id) ? 'selected' : ''}`}
                                    onClick={() => toggleTask(task.id)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedTasks.includes(task.id)}
                                        onChange={() => { }}
                                    />
                                    <span>{index + 1}. {task.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button type="submit" className="big-action-btn bg-emerald-600 hover:bg-emerald-700 w-full" disabled={tasks.length === 0}>
                        <Save size={18} /> {editingId ? t('saveChanges') : t('saveEntry')}
                    </Button>
                </form>
            </Modal>

            <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-white mt-6">
                <FileEdit size={18} /> {t('workEntries')}
            </h2>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="bg-slate-900/50 border-slate-800">
                            <CardContent className="p-4">
                                <Skeleton className="h-6 w-32 mb-2 bg-slate-800" />
                                <Skeleton className="h-5 w-40 mb-2 bg-slate-800" />
                                <Skeleton className="h-4 w-24 bg-slate-800" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : entries.length === 0 ? (
                <div className="empty-state min-h-[50vh] flex flex-col items-center justify-center">
                    <div className="empty-state-icon">
                        <FileEdit size={48} />
                    </div>
                    <div className="empty-state-text">{t('noData')}</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {entries.map(entry => (
                        <Card key={entry.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors group relative overflow-hidden card-hover">
                            <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${entry.status === 'completed' ? 'bg-emerald-500' :
                                entry.status === 'paid' ? 'bg-blue-500' : 'bg-amber-500/50'
                                }`} />

                            <CardContent className="p-3 pl-4 flex flex-col relative z-10">
                                {/* Header Row: Avatar, Info, Quantity */}
                                <div className="flex items-center gap-3 w-full">
                                    {/* Avatar */}
                                    <div className="shrink-0">
                                        <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                                            <UserCircle size={20} />
                                        </div>
                                    </div>

                                    {/* Worker & Date Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white text-sm truncate">
                                            {entry.workers?.name}
                                        </h3>
                                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                            <Calendar size={12} />
                                            {new Date(entry.entry_date).toLocaleDateString()}
                                        </div>
                                    </div>

                                    {/* Quantity */}
                                    <div className="text-right shrink-0">
                                        <div className="text-lg font-bold text-white flex items-center justify-end gap-1">
                                            <Package size={14} className="text-emerald-500" />
                                            {entry.quantity}
                                        </div>
                                        <div className="text-[10px] text-slate-500 uppercase font-bold">{t('quantity')}</div>
                                    </div>
                                </div>

                                {/* Tasks List */}
                                <div className="mt-2 bg-slate-950/30 rounded-md p-2 border border-slate-800/30">
                                    <div className="flex flex-wrap gap-1">
                                        {entry.work_entry_tasks?.map(t => (
                                            <span key={t.task_id} className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                                                {getTaskName(t.task_id)}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Status & Actions Row */}
                                <div className="flex items-center justify-between w-full mt-2">
                                    {entry.status === 'completed' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                                            <CheckCircle2 size={12} /> {t('completed')}
                                        </span>
                                    ) : entry.status === 'paid' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-medium">
                                            <CheckCircle2 size={12} /> {t('paid')}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium">
                                            <Clock size={12} /> {t('inProgress')}
                                        </span>
                                    )}

                                    <div className="flex gap-1.5">
                                        <button
                                            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                            onClick={() => router.push(`?edit=${entry.id}`)}
                                            title={t('edit')}
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            className="p-1.5 rounded-md hover:bg-red-900/20 text-slate-400 hover:text-red-400 transition-colors"
                                            onClick={() => confirmDelete(entry.id)}
                                            title={t('delete')}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title={t('deleteEntryTitle')}
                description={t('deleteEntryDesc')}
                confirmLabel={t('delete')}
                variant="danger"
            />
        </div>
    )
}

export default function EntryPage() {
    return (
        <Suspense fallback={
            <div className="text-center mt-4">
                <Skeleton className="h-8 w-48 mx-auto mb-4 bg-slate-800" />
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-4"><Skeleton className="h-32 bg-slate-800" /></CardContent>
                </Card>
            </div>
        }>
            <EntryContent />
        </Suspense>
    )
}
