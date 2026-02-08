'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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

export default function EntryPage() {
    const { t } = useLanguage()
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get('edit')

    const [workers, setWorkers] = useState<Worker[]>([])
    const [entries, setEntries] = useState<WorkEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')

    // Form state
    const [workerId, setWorkerId] = useState('')
    const [quantity, setQuantity] = useState('')
    const [selectedTasks, setSelectedTasks] = useState<number[]>([])
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
                setSelectedTasks(entry.tasks_completed.split(',').map(Number).filter(n => !isNaN(n)))
                setEntryDate(entry.entry_date)
            }
        }
    }, [editId, entries])

    async function fetchData() {
        setLoading(true)

        const [workersRes, entriesRes] = await Promise.all([
            supabase.from('workers').select('*').order('name'),
            supabase.from('work_entries').select('*, workers(name)').order('entry_date', { ascending: false }).limit(50)
        ])

        if (workersRes.data) setWorkers(workersRes.data)
        if (entriesRes.data) setEntries(entriesRes.data)

        setLoading(false)
    }

    function toggleTask(taskNum: number) {
        if (selectedTasks.includes(taskNum)) {
            setSelectedTasks(selectedTasks.filter(t => t !== taskNum))
        } else {
            setSelectedTasks([...selectedTasks, taskNum].sort())
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!workerId || !quantity || selectedTasks.length === 0) {
            setMessage('Please fill all fields')
            setTimeout(() => setMessage(''), 3000)
            return
        }

        const data = {
            worker_id: workerId,
            quantity: parseInt(quantity),
            tasks_completed: selectedTasks.join(','),
            entry_date: entryDate
        }

        if (editId) {
            const { error } = await supabase
                .from('work_entries')
                .update(data)
                .eq('id', editId)

            if (error) {
                setMessage('Error updating entry')
            } else {
                setMessage('Entry updated!')
                router.push('/entry')
                resetForm()
            }
        } else {
            const { error } = await supabase
                .from('work_entries')
                .insert(data)

            if (error) {
                setMessage('Error adding entry')
            } else {
                setMessage('Entry saved!')
                resetForm()
            }
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

    function getTaskLabel(taskNum: number): string {
        const key = `task${taskNum}` as keyof typeof t
        return t(key)
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
                            {[1, 2, 3, 4, 5, 6].map(taskNum => (
                                <label key={taskNum} className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={selectedTasks.includes(taskNum)}
                                        onChange={() => toggleTask(taskNum)}
                                    />
                                    <span>{taskNum}. {getTaskLabel(taskNum)}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" className="btn btn-success btn-block">
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
                                        {entry.tasks_completed.split(',').map(t => (
                                            <span key={t} className="badge">{t}</span>
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
