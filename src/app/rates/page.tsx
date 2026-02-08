'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { supabase } from '@/lib/supabase'

interface TaskRate {
    id: string
    task_number: number
    task_name: string
    rate: number
}

export default function RatesPage() {
    const { t } = useLanguage()
    const [tasks, setTasks] = useState<TaskRate[]>([])
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')

    // Form state
    const [newTaskName, setNewTaskName] = useState('')
    const [newTaskRate, setNewTaskRate] = useState('')
    const [editId, setEditId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [editRate, setEditRate] = useState('')

    useEffect(() => {
        fetchTasks()
    }, [])

    async function fetchTasks() {
        setLoading(true)
        const { data, error } = await supabase
            .from('task_rates')
            .select('*')
            .order('task_number')

        if (error) {
            console.error('Error fetching tasks:', error)
        } else {
            setTasks(data || [])
        }
        setLoading(false)
    }

    async function handleAddTask(e: React.FormEvent) {
        e.preventDefault()
        if (!newTaskName.trim()) return

        // Get next task number
        const maxNum = tasks.length > 0 ? Math.max(...tasks.map(t => t.task_number)) : 0

        const { error } = await supabase
            .from('task_rates')
            .insert({
                task_number: maxNum + 1,
                task_name: newTaskName.trim(),
                rate: parseFloat(newTaskRate) || 0
            })

        if (error) {
            setMessage('Error adding task')
        } else {
            setMessage('Task added!')
            setNewTaskName('')
            setNewTaskRate('')
            fetchTasks()
        }
        setTimeout(() => setMessage(''), 3000)
    }

    async function handleUpdateTask(id: string) {
        const { error } = await supabase
            .from('task_rates')
            .update({
                task_name: editName,
                rate: parseFloat(editRate) || 0
            })
            .eq('id', id)

        if (error) {
            setMessage('Error updating task')
        } else {
            setMessage('Task updated!')
            setEditId(null)
            fetchTasks()
        }
        setTimeout(() => setMessage(''), 3000)
    }

    async function handleDeleteTask(id: string) {
        if (!confirm('Delete this task?')) return

        const { error } = await supabase
            .from('task_rates')
            .delete()
            .eq('id', id)

        if (error) {
            setMessage('Error deleting task')
        } else {
            setMessage('Task deleted!')
            fetchTasks()
        }
        setTimeout(() => setMessage(''), 3000)
    }

    function startEdit(task: TaskRate) {
        setEditId(task.id)
        setEditName(task.task_name)
        setEditRate(task.rate.toString())
    }

    return (
        <div>
            <div className="header">
                <h1>💰 {t('rates')}</h1>
            </div>

            {message && (
                <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
                    {message}
                </div>
            )}

            {/* Add New Task Form */}
            <div className="card">
                <h3 style={{ marginTop: 0 }}>➕ {t('add')} Task</h3>
                <form onSubmit={handleAddTask}>
                    <div className="form-group">
                        <label className="form-label">{t('taskName')}</label>
                        <input
                            type="text"
                            className="form-input"
                            value={newTaskName}
                            onChange={(e) => setNewTaskName(e.target.value)}
                            placeholder="Enter task name..."
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{t('ratePerItem')}</label>
                        <input
                            type="number"
                            className="form-input"
                            value={newTaskRate}
                            onChange={(e) => setNewTaskRate(e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                        />
                    </div>
                    <button type="submit" className="btn btn-success btn-block">
                        ➕ {t('add')} Task
                    </button>
                </form>
            </div>

            <h2>📋 Task List</h2>

            {loading ? (
                <div className="text-center">{t('loading')}</div>
            ) : tasks.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <div>{t('noData')} - Add your first task above!</div>
                </div>
            ) : (
                <div>
                    {tasks.map(task => (
                        <div key={task.id} className="card">
                            {editId === task.id ? (
                                /* Edit Mode */
                                <div>
                                    <div className="form-group">
                                        <label className="form-label">{t('taskName')}</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('ratePerItem')}</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={editRate}
                                            onChange={(e) => setEditRate(e.target.value)}
                                            step="0.01"
                                            min="0"
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="btn btn-success btn-block"
                                            onClick={() => handleUpdateTask(task.id)}
                                        >
                                            ✓ {t('save')}
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => setEditId(null)}
                                        >
                                            {t('cancel')}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* View Mode */
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                                            #{task.task_number}
                                        </div>
                                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                                            {task.task_name}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div className="amount">
                                            ₹{task.rate.toFixed(2)}
                                        </div>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.5rem 0.75rem', minHeight: 'auto' }}
                                            onClick={() => startEdit(task)}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            style={{ padding: '0.5rem 0.75rem', minHeight: 'auto' }}
                                            onClick={() => handleDeleteTask(task.id)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
