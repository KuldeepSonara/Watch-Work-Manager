'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
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
    sort_order: number
}

export default function RatesPage() {
    const { t } = useLanguage()
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [newName, setNewName] = useState('')
    const [newRate, setNewRate] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [editRate, setEditRate] = useState('')

    useEffect(() => {
        fetchTasks()
    }, [])

    async function fetchTasks() {
        setLoading(true)
        try {
            const res = await fetch('/api/tasks')
            const data = await res.json()
            if (res.ok) {
                setTasks(data)
            } else {
                toast.error(data.error || 'Failed to load tasks')
            }
        } catch {
            toast.error('Failed to load tasks')
        }
        setLoading(false)
    }

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault()
        if (!newName.trim()) return

        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName.trim(),
                    rate: parseFloat(newRate) || 0,
                    sort_order: tasks.length
                })
            })

            if (res.ok) {
                toast.success('Task added!')
                setNewName('')
                setNewRate('')
                fetchTasks()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to add task')
            }
        } catch {
            toast.error('Failed to add task')
        }
    }

    async function handleUpdate(id: string) {
        try {
            const res = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editName.trim(),
                    rate: parseFloat(editRate) || 0
                })
            })

            if (res.ok) {
                toast.success('Task updated!')
                setEditingId(null)
                fetchTasks()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to update task')
            }
        } catch {
            toast.error('Failed to update task')
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this task?')) return

        try {
            const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Task deleted!')
                fetchTasks()
            } else {
                toast.error('Failed to delete task')
            }
        } catch {
            toast.error('Failed to delete task')
        }
    }

    function startEdit(task: Task) {
        setEditingId(task.id)
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

            {/* Add Task Form */}
            <Card className="mb-4 bg-slate-900/50 border-slate-800">
                <CardContent className="p-4">
                    <form onSubmit={handleAdd}>
                        <div className="form-group">
                            <label className="form-label">
                                <FileText size={18} /> {t('taskName')}
                            </label>
                            <Input
                                className="large-input bg-slate-800 border-slate-700"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder={t('taskName')}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">
                                <IndianRupee size={18} /> {t('ratePerItem')}
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                className="large-input bg-slate-800 border-slate-700"
                                value={newRate}
                                onChange={(e) => setNewRate(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <Button type="submit" className="big-action-btn bg-emerald-600 hover:bg-emerald-700 w-full">
                            <Plus size={18} /> {t('add')}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-white">
                <FileText size={18} /> Tasks
            </h2>

            {/* Tasks List */}
            {loading ? (
                <div>
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="mb-2 bg-slate-900/50 border-slate-800">
                            <CardContent className="p-4">
                                <Skeleton className="h-6 w-32 mb-2 bg-slate-800" />
                                <Skeleton className="h-4 w-20 bg-slate-800" />
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
                </div>
            ) : (
                <div>
                    {tasks.map((task, index) => (
                        <Card key={task.id} className="mb-2 bg-slate-900/50 border-slate-800">
                            <CardContent className="p-3">
                                {editingId === task.id ? (
                                    <div>
                                        <div className="flex gap-2 mb-2">
                                            <Input
                                                className="large-input flex-1 bg-slate-800 border-slate-700"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                className="large-input flex-1 bg-slate-800 border-slate-700"
                                                value={editRate}
                                                onChange={(e) => setEditRate(e.target.value)}
                                                placeholder="Rate"
                                            />
                                            <button
                                                className="icon-btn icon-btn-edit bg-emerald-600"
                                                onClick={() => handleUpdate(task.id)}
                                            >
                                                <Save size={18} />
                                            </button>
                                            <button
                                                className="icon-btn icon-btn-edit"
                                                onClick={() => setEditingId(null)}
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="font-semibold text-white flex items-center gap-2">
                                                <span className="text-emerald-400">{index + 1}.</span> {task.name}
                                            </div>
                                            <div className="text-emerald-400 font-bold flex items-center gap-1">
                                                <IndianRupee size={14} /> {task.rate.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="icon-btn icon-btn-edit" onClick={() => startEdit(task)}>
                                                <Pencil size={18} />
                                            </button>
                                            <button className="icon-btn icon-btn-delete" onClick={() => handleDelete(task.id)}>
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
