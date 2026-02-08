'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { supabase } from '@/lib/supabase'
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
    const [editId, setEditId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')

    useEffect(() => {
        fetchWorkers()
    }, [])

    async function fetchWorkers() {
        setLoading(true)
        const { data, error } = await supabase
            .from('workers')
            .select('*')
            .order('name')

        if (error) {
            toast.error('Error loading workers')
        } else {
            setWorkers(data || [])
        }
        setLoading(false)
    }

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault()
        if (!newName.trim()) return

        const { error } = await supabase
            .from('workers')
            .insert({ name: newName.trim() })

        if (error) {
            toast.error('Error adding worker')
        } else {
            toast.success('Worker added!')
            setNewName('')
            fetchWorkers()
        }
    }

    async function handleUpdate(id: string) {
        if (!editName.trim()) return

        const { error } = await supabase
            .from('workers')
            .update({ name: editName.trim() })
            .eq('id', id)

        if (error) {
            toast.error('Error updating worker')
        } else {
            toast.success('Worker updated!')
            setEditId(null)
            fetchWorkers()
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this worker?')) return

        const { error } = await supabase
            .from('workers')
            .delete()
            .eq('id', id)

        if (error) {
            toast.error('Error deleting worker')
        } else {
            toast.success('Worker deleted!')
            fetchWorkers()
        }
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
                    <div className="text-base font-semibold mb-3 flex items-center gap-2 text-white">
                        <Plus size={20} className="text-emerald-400" /> {t('addWorker')}
                    </div>
                    <form onSubmit={handleAdd}>
                        <div className="form-group">
                            <label className="form-label">
                                <UserCircle size={18} /> {t('workerName')}
                            </label>
                            <Input
                                type="text"
                                className="large-input bg-slate-800 border-slate-700"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder={t('workerName') + '...'}
                                required
                            />
                        </div>
                        <Button type="submit" className="big-action-btn w-full bg-emerald-600 hover:bg-emerald-700">
                            <Plus size={20} /> {t('add')}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-white">
                <Users size={18} /> {t('workerList')} ({workers.length})
            </h2>

            {loading ? (
                <div>
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="mb-2 bg-slate-900/50 border-slate-800">
                            <CardContent className="p-4 flex items-center gap-3">
                                <Skeleton className="w-11 h-11 rounded-full bg-slate-800" />
                                <Skeleton className="h-5 w-32 bg-slate-800" />
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
                    <div className="text-slate-500 text-sm">Add your first worker above!</div>
                </div>
            ) : (
                <div>
                    {workers.map(worker => (
                        <Card key={worker.id} className="mb-2 bg-slate-900/50 border-slate-800">
                            <CardContent className="p-4">
                                {editId === worker.id ? (
                                    /* Edit Mode */
                                    <div>
                                        <div className="form-group">
                                            <Input
                                                type="text"
                                                className="large-input bg-slate-800 border-slate-700"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="action-grid">
                                            <Button
                                                className="big-action-btn bg-emerald-600 hover:bg-emerald-700"
                                                onClick={() => handleUpdate(worker.id)}
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
                                    <div className="worker-card">
                                        <div className="worker-info">
                                            <div className="worker-avatar">
                                                <UserCircle size={24} />
                                            </div>
                                            <div className="worker-name text-white">{worker.name}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                className="icon-btn icon-btn-edit"
                                                onClick={() => { setEditId(worker.id); setEditName(worker.name) }}
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                className="icon-btn icon-btn-delete"
                                                onClick={() => handleDelete(worker.id)}
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
