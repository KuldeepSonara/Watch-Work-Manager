'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Coins, Plus, FileText, Pencil, Trash2, Save, X, IndianRupee } from 'lucide-react'

interface Task {
    id: string
    name: string
    rate: number
    is_active: boolean
    sort_order: number
}

export default function RatesPage() {
    const { t } = useLanguage()
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)

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
            .from('tasks')
            .select('*')
            .eq('is_active', true)
            .order('sort_order')

        if (error) {
            toast.error('Error loading tasks')
        } else {
            setTasks(data || [])
        }
        setLoading(false)
    }

    async function handleAddTask(e: React.FormEvent) {
        e.preventDefault()
        if (!newTaskName.trim()) return

        const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.sort_order)) : 0

        const { error } = await supabase
            .from('tasks')
            .insert({
                name: newTaskName.trim(),
                rate: parseFloat(newTaskRate) || 0,
                is_active: true,
                sort_order: maxOrder + 1
            })

        if (error) {
            toast.error('Error adding task')
        } else {
            toast.success('Task added!')
            setNewTaskName('')
            setNewTaskRate('')
            fetchTasks()
        }
    }

    async function handleUpdateTask(id: string) {
        const { error } = await supabase
            .from('tasks')
            .update({
                name: editName,
                rate: parseFloat(editRate) || 0
            })
            .eq('id', id)

        if (error) {
            toast.error('Error updating task')
        } else {
            toast.success('Task updated!')
            setEditId(null)
            fetchTasks()
        }
    }

    async function handleDeleteTask(id: string) {
        if (!confirm('Delete this task?')) return

        const { error } = await supabase
            .from('tasks')
            .update({ is_active: false })
            .eq('id', id)

        if (error) {
            toast.error('Error deleting task')
        } else {
            toast.success('Task deleted!')
            fetchTasks()
        }
    }

    function startEdit(task: Task) {
        setEditId(task.id)
        setEditName(task.name)
        setEditRate(task.rate.toString())
    }

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <h1>
                    <Coins className="icon" size={28} />
                    {t('rates')}
                </h1>
            </div>

            {/* Add New Task Form */}
            <Card className="mb-4 bg-slate-900/50 border-slate-800">
                <CardContent className="p-4">
                    <div className="text-base font-semibold mb-3 flex items-center gap-2 text-white">
                        <Plus size={20} className="text-emerald-400" /> {t('add')} Task
                    </div>
                    <form onSubmit={handleAddTask}>
                        <div className="form-group">
                            <label className="form-label">
                                <FileText size={18} /> {t('taskName')}
                            </label>
                            <Input
                                type="text"
                                className="large-input bg-slate-800 border-slate-700"
                                value={newTaskName}
                                onChange={(e) => setNewTaskName(e.target.value)}
                                placeholder="Enter task name..."
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">
                                <IndianRupee size={18} /> {t('ratePerItem')}
                            </label>
                            <Input
                                type="number"
                                className="large-input bg-slate-800 border-slate-700"
                                value={newTaskRate}
                                onChange={(e) => setNewTaskRate(e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                            />
                        </div>
                        <Button type="submit" className="big-action-btn w-full bg-emerald-600 hover:bg-emerald-700">
                            <Plus size={20} /> {t('add')} Task
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-white">
                <FileText size={18} /> Task List
            </h2>

            {loading ? (
                <div>
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="mb-2 bg-slate-900/50 border-slate-800">
                            <CardContent className="p-4">
                                <Skeleton className="h-4 w-20 mb-2 bg-slate-800" />
                                <Skeleton className="h-6 w-40 bg-slate-800" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : tasks.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Coins size={48} />
                    </div>
                    <div className="empty-state-text">{t('noData')}</div>
                    <div className="text-slate-500 text-sm">Add your first task above!</div>
                </div>
            ) : (
                <div>
                    {tasks.map((task, index) => (
                        <Card key={task.id} className="mb-2 bg-slate-900/50 border-slate-800">
                            <CardContent className="p-4">
                                {editId === task.id ? (
                                    /* Edit Mode */
                                    <div>
                                        <div className="form-group">
                                            <label className="form-label">
                                                <FileText size={18} /> {t('taskName')}
                                            </label>
                                            <Input
                                                type="text"
                                                className="large-input bg-slate-800 border-slate-700"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">
                                                <IndianRupee size={18} /> {t('ratePerItem')}
                                            </label>
                                            <Input
                                                type="number"
                                                className="large-input bg-slate-800 border-slate-700"
                                                value={editRate}
                                                onChange={(e) => setEditRate(e.target.value)}
                                                step="0.01"
                                                min="0"
                                            />
                                        </div>
                                        <div className="action-grid">
                                            <Button
                                                className="big-action-btn bg-emerald-600 hover:bg-emerald-700"
                                                onClick={() => handleUpdateTask(task.id)}
                                            >
                                                <Save size={18} /> {t('save')}
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                className="big-action-btn bg-slate-700 hover:bg-slate-600"
                                                onClick={() => setEditId(null)}
                                            >
                                                <X size={18} /> {t('cancel')}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    /* View Mode */
                                    <div className="flex justify-between items-center gap-3">
                                        <div className="flex-1">
                                            <div className="text-sm text-slate-400">#{index + 1}</div>
                                            <div className="text-base font-semibold text-white">{task.name}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="amount-display">₹{task.rate.toFixed(2)}</div>
                                            <button
                                                className="icon-btn icon-btn-edit"
                                                onClick={() => startEdit(task)}
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                className="icon-btn icon-btn-delete"
                                                onClick={() => handleDeleteTask(task.id)}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
