'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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

function EntryContent() {
    const { t } = useLanguage()
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get('edit')

    const [workers, setWorkers] = useState<Worker[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [entries, setEntries] = useState<WorkEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')

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
            setMessage('Please fill all fields')
            setTimeout(() => setMessage(''), 3000)
            return
        }

        if (editId) {
            // Update existing entry
            const { error: updateError } = await supabase
                .from('work_entries')
                .update({
                    worker_id: workerId,
                    quantity: parseInt(quantity),
                    entry_date: entryDate
                })
                .eq('id', editId)

            if (updateError) {
                setMessage('Error updating entry')
                setTimeout(() => setMessage(''), 3000)
                return
            }

            // Delete old task links
            await supabase.from('work_entry_tasks').delete().eq('work_entry_id', editId)

            // Insert new task links
            const taskLinks = selectedTasks.map(taskId => ({
                work_entry_id: editId,
                task_id: taskId
            }))
            await supabase.from('work_entry_tasks').insert(taskLinks)

            setMessage('Entry updated!')
            router.push('/entry')
            resetForm()
        } else {
            // Create new entry
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
                setMessage('Error adding entry')
                setTimeout(() => setMessage(''), 3000)
                return
            }

            // Insert task links
            const taskLinks = selectedTasks.map(taskId => ({
                work_entry_id: newEntry.id,
                task_id: taskId
            }))
            await supabase.from('work_entry_tasks').insert(taskLinks)

            setMessage('Entry saved!')
            resetForm()
        }

        fetchData()
        setTimeout(() => setMessage(''), 3000)
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
            setMessage('Entry deleted!')
            fetchData()
        }
        setTimeout(() => setMessage(''), 3000)
    }

    function getTaskName(taskId: string): string {
        const task = tasks.find(t => t.id === taskId)
        return task ? task.name : 'Unknown'
    }

    function getEntryTaskNames(entry: WorkEntry): string[] {
        return entry.work_entry_tasks?.map(t => getTaskName(t.task_id)) || []
    }

    return (
        <div>
            <div className="header">
                <h1>📝 {editId ? t('editEntry') : t('entry')}</h1>
            </div>

            {message && (
                <div className={`alert ${message.includes('Error') || message.includes('Please') ? 'alert-error' : 'alert-success'}`}>
                    {message}
                </div>
            )}

            {tasks.length === 0 && !loading ? (
                <div className="alert alert-error">
                    ⚠️ No tasks found! Please add tasks in Task Rates first.
                </div>
            ) : null}

            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">{t('selectWorker')}</label>
                        <select
                            className="form-select"
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
                        <label className="form-label">{t('quantity')}</label>
                        <input
                            type="number"
                            className="form-input"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="1000"
                            min="1"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('entryDate')}</label>
                        <input
                            type="date"
                            className="form-input"
                            value={entryDate}
                            onChange={(e) => setEntryDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('tasksCompleted')}</label>
                        <div className="checkbox-group">
                            {tasks.map((task, index) => (
                                <label key={task.id} className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={selectedTasks.includes(task.id)}
                                        onChange={() => toggleTask(task.id)}
                                    />
                                    <span>{index + 1}. {task.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" className="btn btn-success btn-block" disabled={tasks.length === 0}>
                            {editId ? t('editEntry') : t('saveEntry')} ✓
                        </button>
                        {editId && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => { router.push('/entry'); resetForm() }}
                            >
                                {t('cancel')}
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <h2 className="mt-4">{t('workEntries')}</h2>

            {loading ? (
                <div className="text-center">{t('loading')}</div>
            ) : entries.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📝</div>
                    <div>{t('noData')}</div>
                </div>
            ) : (
                <div>
                    {entries.map(entry => (
                        <div key={entry.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                        👷 {entry.workers?.name}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                        📅 {new Date(entry.entry_date).toLocaleDateString()}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 600 }}>
                                        {entry.quantity} items
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                                        {getEntryTaskNames(entry).map((name, idx) => (
                                            <span key={idx} className="badge" title={name}>
                                                {name.substring(0, 8)}...
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                <button
                                    className="btn btn-secondary btn-block"
                                    style={{ padding: '0.5rem' }}
                                    onClick={() => router.push(`/entry?edit=${entry.id}`)}
                                >
                                    ✏️ {t('edit')}
                                </button>
                                <button
                                    className="btn btn-danger"
                                    style={{ padding: '0.5rem 1rem' }}
                                    onClick={() => handleDelete(entry.id)}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default function EntryPage() {
    return (
        <Suspense fallback={<div className="text-center">Loading...</div>}>
            <EntryContent />
        </Suspense>
    )
}
