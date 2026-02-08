'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Coins, Plus, FileText, Pencil, Trash2, Save, X, IndianRupee } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'

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
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [editName, setEditName] = useState('')
    const [editRate, setEditRate] = useState('')
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    useEffect(() => {
        fetchTasks()
    }, [])

    async function fetchTasks() {
        setLoading(true)
        try {
            const res = await fetch('/api/manage-tasks')
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
        if (!newName.trim() || !newRate.trim()) return

        try {
            const res = await fetch('/api/manage-tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName.trim(),
                    rate: parseFloat(newRate),
                    sort_order: tasks.length + 1
                })
            })

            if (res.ok) {
                toast.success('Task added!')
                setNewName('')
                setNewRate('')
                setIsAddModalOpen(false)
                fetchTasks()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to add task')
            }
        } catch {
            toast.error('Failed to add task')
        }
    }

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault()
        if (!editingTask || !editName.trim() || !editRate.trim()) return

        try {
            const res = await fetch(`/api/tasks/${editingTask.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editName.trim(),
                    rate: parseFloat(editRate)
                })
            })

            if (res.ok) {
                toast.success('Task updated!')
                setEditingTask(null)
                fetchTasks()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to update task')
            }
        } catch {
            toast.error('Failed to update task')
        }
    }

    function confirmDelete(id: string) {
        setDeleteId(id)
    }

    async function handleDelete() {
        if (!deleteId) return

        try {
            const res = await fetch(`/api/tasks/${deleteId}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Task deleted!')
                fetchTasks()
            } else {
                toast.error('Failed to delete task')
            }
        } catch {
            toast.error('Failed to delete task')
        } finally {
            setDeleteId(null)
        }
    }

    function startEdit(task: Task) {
        setEditingTask(task)
        setEditName(task.name)
        setEditRate(task.rate.toString())
    }

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <h1>
                    <Coins className="icon" size={28} />
                    {t('taskRates')}
                </h1>
            </div>

            {/* Add Button */}
            <Button
                className="fixed bottom-24 right-4 h-14 w-14 rounded-2xl shadow-lg bg-emerald-600 hover:bg-emerald-700 md:static md:w-full md:h-12 md:mb-4 md:shadow-none z-40"
                onClick={() => setIsAddModalOpen(true)}
            >
                <Plus size={24} /> <span className="hidden md:inline ml-2">{t('addTask')}</span>
            </Button>

            {/* Add Task Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={
                    <>
                        <Plus size={20} className="text-emerald-400" /> {t('addTask')}
                    </>
                }
            >
                <form onSubmit={handleAdd}>
                    <div className="form-group">
                        <label className="form-label">Task Name</label>
                        <Input
                            className="large-input bg-slate-800 border-slate-700"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g., Stitching"
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Rate (₹)</label>
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
            </Modal>

            {/* Edit Task Modal */}
            <Modal
                isOpen={!!editingTask}
                onClose={() => setEditingTask(null)}
                title={
                    <>
                        <Pencil size={20} className="text-emerald-400" /> Edit Task
                    </>
                }
            >
                <form onSubmit={handleUpdate}>
                    <div className="form-group">
                        <label className="form-label">Task Name</label>
                        <Input
                            className="large-input bg-slate-800 border-slate-700"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="e.g., Stitching"
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Rate (₹)</label>
                        <Input
                            type="number"
                            step="0.01"
                            className="large-input bg-slate-800 border-slate-700"
                            value={editRate}
                            onChange={(e) => setEditRate(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                    <Button type="submit" className="big-action-btn bg-emerald-600 hover:bg-emerald-700 w-full">
                        <Save size={18} /> Save Changes
                    </Button>
                </form>
            </Modal>

            <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-white">
                <Coins size={18} /> {t('taskList')}
            </h2>

            {/* Tasks List */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <Card key={i} className="bg-slate-900/50 border-slate-800">
                            <CardContent className="p-4">
                                <Skeleton className="h-6 w-32 mb-4 bg-slate-800" />
                                <Skeleton className="h-10 w-24 bg-slate-800" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : tasks.length === 0 ? (
                <div className="empty-state min-h-[50vh] flex flex-col items-center justify-center">
                    <div className="empty-state-icon">
                        <Coins size={48} />
                    </div>
                    <div className="empty-state-text">{t('noData')}</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {tasks.map((task, index) => (
                        <Card
                            key={task.id}
                            className="bg-slate-900/50 border-slate-800 hover:border-emerald-500/50 transition-all duration-300 group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                            <CardContent className="p-3 md:p-6 flex md:flex-col items-center justify-between md:justify-center relative z-10 h-full">
                                {/* Mobile Row / Desktop Col Wrapper */}
                                <div className="flex md:flex-col items-center gap-3 md:gap-4 min-w-0 w-full md:text-center">
                                    {/* Icon / Number */}
                                    <div className="relative shrink-0">
                                        <div className="h-10 w-10 md:h-20 md:w-20 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 shadow-md border border-slate-700 group-hover:border-emerald-500/30 transition-colors">
                                            <span className="text-sm md:text-2xl font-bold">#{index + 1}</span>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="min-w-0 w-full">
                                        <div className="font-bold text-white text-base md:text-xl leading-tight truncate mb-0.5 md:mb-2">
                                            {task.name}
                                        </div>
                                        <div className="text-sm md:text-lg font-bold text-emerald-400 flex items-center md:justify-center gap-1">
                                            <IndianRupee size={14} className="md:w-5 md:h-5" />
                                            {task.rate.toFixed(2)}
                                            <span className="text-[10px] md:text-xs text-slate-500 font-medium uppercase ml-1 tracking-wide self-center">Per Item</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex md:w-full gap-2 shrink-0 ml-2 md:ml-0 md:mt-5 md:justify-center">
                                    <button
                                        className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700/50"
                                        onClick={() => startEdit(task)}
                                        title="Edit"
                                        aria-label="Edit task"
                                    >
                                        <Pencil size={15} className="md:w-5 md:h-5" />
                                    </button>
                                    <button
                                        className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-slate-800 hover:bg-red-900/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors border border-slate-700/50 hover:border-red-900/50"
                                        onClick={() => confirmDelete(task.id)}
                                        title="Delete"
                                        aria-label="Delete task"
                                    >
                                        <Trash2 size={15} className="md:w-5 md:h-5" />
                                    </button>
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
                title="Delete Task"
                description="Are you sure you want to delete this task?"
                confirmLabel="Delete"
                variant="danger"
            />
        </div>
    )
}
