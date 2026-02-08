'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Plus, UserCircle, Pencil, Trash2, Save, X } from 'lucide-react'

interface Worker {
    id: string
    name: string
}

export default function WorkersPage() {
    const { t } = useLanguage()
    const [workers, setWorkers] = useState<Worker[]>([])
    const [loading, setLoading] = useState(true)
    const [newName, setNewName] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')

    useEffect(() => {
        fetchWorkers()
    }, [])

    async function fetchWorkers() {
        setLoading(true)
        try {
            const res = await fetch('/api/workers')
            const data = await res.json()
            if (res.ok) {
                setWorkers(data)
            } else {
                toast.error(data.error || 'Failed to load workers')
            }
        } catch {
            toast.error('Failed to load workers')
        }
        setLoading(false)
    }

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault()
        if (!newName.trim()) return

        try {
            const res = await fetch('/api/workers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim() })
            })

            if (res.ok) {
                toast.success('Worker added!')
                setNewName('')
                fetchWorkers()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to add worker')
            }
        } catch {
            toast.error('Failed to add worker')
        }
    }

    async function handleUpdate(id: string) {
        if (!editName.trim()) return

        try {
            const res = await fetch(`/api/workers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName.trim() })
            })

            if (res.ok) {
                toast.success('Worker updated!')
                setEditingId(null)
                fetchWorkers()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to update worker')
            }
        } catch {
            toast.error('Failed to update worker')
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this worker?')) return

        try {
            const res = await fetch(`/api/workers/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Worker deleted!')
                fetchWorkers()
            } else {
                toast.error('Failed to delete worker')
            }
        } catch {
            toast.error('Failed to delete worker')
        }
    }

    function startEdit(worker: Worker) {
        setEditingId(worker.id)
        setEditName(worker.name)
    }

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <h1>
                    <Users className="icon" size={28} />
                    {t('workers')}
                </h1>
            </div>

            {/* Add Worker Form */}
            <Card className="mb-4 bg-slate-900/50 border-slate-800">
                <CardContent className="p-4">
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <Input
                            className="large-input flex-1 bg-slate-800 border-slate-700"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={t('workerName')}
                        />
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 h-14 px-6">
                            <Plus size={20} />
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-white">
                <UserCircle size={18} /> {t('workerList')}
            </h2>

            {/* Workers List */}
            {loading ? (
                <div>
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="mb-2 bg-slate-900/50 border-slate-800">
                            <CardContent className="p-4">
                                <Skeleton className="h-6 w-32 bg-slate-800" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : workers.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Users size={48} />
                    </div>
                    <div className="empty-state-text">{t('noData')}</div>
                </div>
            ) : (
                <div>
                    {workers.map(worker => (
                        <Card key={worker.id} className="mb-2 bg-slate-900/50 border-slate-800">
                            <CardContent className="p-3">
                                {editingId === worker.id ? (
                                    <div className="flex gap-2">
                                        <Input
                                            className="large-input flex-1 bg-slate-800 border-slate-700"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            autoFocus
                                        />
                                        <button
                                            className="icon-btn icon-btn-edit bg-emerald-600"
                                            onClick={() => handleUpdate(worker.id)}
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
                                ) : (
                                    <div className="worker-card">
                                        <div className="worker-info">
                                            <div className="worker-avatar">
                                                <UserCircle size={24} />
                                            </div>
                                            <span className="worker-name">{worker.name}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="icon-btn icon-btn-edit" onClick={() => startEdit(worker)}>
                                                <Pencil size={18} />
                                            </button>
                                            <button className="icon-btn icon-btn-delete" onClick={() => handleDelete(worker.id)}>
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
