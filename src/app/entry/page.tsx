'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/LanguageContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { FileEdit, UserCircle, Package, Calendar, CheckSquare, Save, X, Pencil, Trash2 } from 'lucide-react'

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

function EntryContent() {
    const { t } = useLanguage()
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get('edit')

    const [workers, setWorkers] = useState<Worker[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [entries, setEntries] = useState<WorkEntry[]>([])
    const [loading, setLoading] = useState(true)

    // Form state
    const [workerId, setWorkerId] = useState('')
    const [quantity, setQuantity] = useState('')
    const [selectedTasks, setSelectedTasks] = useState<string[]>([])
    const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (editId && entries.length > 0) {
            const entry = entries.find(e => e.id === editId)
            if (entry) {
                setWorkerId(entry.worker_id)
                setQuantity(entry.quantity.toString())
                setSelectedTasks(entry.work_entry_tasks?.map(t => t.task_id) || [])
                setEntryDate(entry.entry_date)
            }
        }
    }, [editId, entries])

    async function fetchData() {
        setLoading(true)

        const [workersRes, tasksRes, entriesRes] = await Promise.all([
            supabase.from('workers').select('*').order('name'),
            supabase.from('tasks').select('*').eq('is_active', true).order('sort_order'),
            supabase.from('work_entries')
                .select('*, workers(name), work_entry_tasks(task_id)')
                .order('entry_date', { ascending: false })
                .limit(50)
        ])

        if (workersRes.data) setWorkers(workersRes.data)
        if (tasksRes.data) setTasks(tasksRes.data)
        if (entriesRes.data) setEntries(entriesRes.data)

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

        if (editId) {
            const { error: updateError } = await supabase
                .from('work_entries')
                .update({
                    worker_id: workerId,
                    quantity: parseInt(quantity),
                    entry_date: entryDate
                })
                .eq('id', editId)

            if (updateError) {
                toast.error('Error updating entry')
                return
            }

            await supabase.from('work_entry_tasks').delete().eq('work_entry_id', editId)

            const taskLinks = selectedTasks.map(taskId => ({
                work_entry_id: editId,
                task_id: taskId
            }))
            await supabase.from('work_entry_tasks').insert(taskLinks)

            toast.success('Entry updated!')
            router.push('/entry')
            resetForm()
        } else {
            const { data: newEntry, error: insertError } = await supabase
                .from('work_entries')
                .insert({
                    worker_id: workerId,
                    quantity: parseInt(quantity),
                    entry_date: entryDate
                })
                .select()
                .single()

            if (insertError || !newEntry) {
                toast.error('Error adding entry')
                return
            }

            const taskLinks = selectedTasks.map(taskId => ({
                work_entry_id: newEntry.id,
                task_id: taskId
            }))
            await supabase.from('work_entry_tasks').insert(taskLinks)

            toast.success('Entry saved!')
            resetForm()
        }

        fetchData()
    }

    function resetForm() {
        setWorkerId('')
        setQuantity('')
        setSelectedTasks([])
        setEntryDate(new Date().toISOString().split('T')[0])
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this entry?')) return

        const { error } = await supabase
            .from('work_entries')
            .delete()
            .eq('id', id)

        if (!error) {
            toast.success('Entry deleted!')
            fetchData()
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
                    {editId ? t('editEntry') : t('entry')}
                </h1>
            </div>

            {tasks.length === 0 && !loading && (
                <div className="alert alert-warning">
                    No tasks found! Add tasks in Task Rates first.
                </div>
            )}

            {/* Entry Form */}
            <Card className="mb-4 bg-slate-900/50 border-slate-800">
                <CardContent className="p-4">
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

                        <div className="action-grid">
                            <Button type="submit" className="big-action-btn bg-emerald-600 hover:bg-emerald-700" disabled={tasks.length === 0}>
                                <Save size={18} /> {editId ? t('editEntry') : t('saveEntry')}
                            </Button>
                            {editId && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="big-action-btn bg-slate-700 hover:bg-slate-600"
                                    onClick={() => { router.push('/entry'); resetForm() }}
                                >
                                    <X size={18} /> {t('cancel')}
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-white">
                <FileEdit size={18} /> {t('workEntries')}
            </h2>

            {loading ? (
                <div>
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="mb-2 bg-slate-900/50 border-slate-800">
                            <CardContent className="p-4">
                                <Skeleton className="h-4 w-24 mb-2 bg-slate-800" />
                                <Skeleton className="h-5 w-40 mb-2 bg-slate-800" />
                                <Skeleton className="h-4 w-32 bg-slate-800" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : entries.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <FileEdit size={48} />
                    </div>
                    <div className="empty-state-text">{t('noData')}</div>
                </div>
            ) : (
                <div>
                    {entries.map(entry => (
                        <Card key={entry.id} className="mb-2 entry-card bg-slate-900/50 border-slate-800">
                            <CardContent className="p-4">
                                <div className="entry-header">
                                    <div>
                                        <div className="entry-worker text-white">
                                            <UserCircle size={18} className="text-emerald-400" /> {entry.workers?.name}
                                        </div>
                                        <div className="entry-date">
                                            <Calendar size={14} /> {new Date(entry.entry_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="entry-quantity">{entry.quantity}</div>
                                </div>
                                <div className="entry-tasks">
                                    {entry.work_entry_tasks?.map(t => (
                                        <span key={t.task_id} className="entry-task-badge">
                                            {getTaskName(t.task_id)}
                                        </span>
                                    ))}
                                </div>
                                <div className="entry-actions">
                                    <Button
                                        variant="secondary"
                                        className="flex-1 bg-slate-700 hover:bg-slate-600"
                                        onClick={() => router.push(`/entry?edit=${entry.id}`)}
                                    >
                                        <Pencil size={16} /> {t('edit')}
                                    </Button>
                                    <button
                                        className="icon-btn icon-btn-delete"
                                        onClick={() => handleDelete(entry.id)}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
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
