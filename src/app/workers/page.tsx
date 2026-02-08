'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Plus, UserCircle, Pencil, Trash2, Save, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import api, { handleApiError } from '@/lib/api'
import { ApiEndpoints } from '@/lib/enums'
import { ERROR_CODES } from '@/lib/constants'

interface Worker {
    id: string
    name: string
    pendingAmount?: number
}

export default function WorkersPage() {
    const { t } = useLanguage()
    const [workers, setWorkers] = useState<Worker[]>([])
    const [loading, setLoading] = useState(true)
    const [newName, setNewName] = useState('')
    const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
    const [editName, setEditName] = useState('')
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    useEffect(() => {
        fetchWorkers()
    }, [])

    async function fetchWorkers() {
        setLoading(true)
        try {
            const res = await api.get(ApiEndpoints.WORKERS)
            setWorkers(res.data)
        } catch (error) {
            toast.error(handleApiError(error, 'Failed to load workers'))
        }
        setLoading(false)
    }

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault()
        if (!newName.trim()) return

        try {
            await api.post(ApiEndpoints.WORKERS, { name: newName.trim() })
            toast.success(t('workerAdded'))
            setNewName('')
            setIsAddModalOpen(false)
            fetchWorkers()
        } catch (error) {
            toast.error(handleApiError(error, t('failedAddWorker')))
        }
    }

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault()
        if (!editingWorker || !editName.trim()) return

        try {
            await api.put(`${ApiEndpoints.WORKERS}/${editingWorker.id}`, { name: editName.trim() })
            toast.success(t('workerUpdated'))
            setEditingWorker(null)
            fetchWorkers()
        } catch (error) {
            toast.error(handleApiError(error, t('failedUpdateWorker')))
        }
    }

    function confirmDelete(id: string) {
        setDeleteId(id)
    }

    async function handleDelete() {
        if (!deleteId) return

        try {
            await api.delete(`${ApiEndpoints.WORKERS}/${deleteId}`)
            toast.success(t('workerDeleted'))
            fetchWorkers()
        } catch (error) {
            const data = (error as any).response?.data
            // Check for specific validation error
            if (data?.error === ERROR_CODES.WORKER_HAS_PENDING_WORK) {
                toast.error(t('cannotDeleteWorkerPending'))
            } else {
                toast.error(handleApiError(error, t('failedDeleteWorker')))
            }
        }
        finally {
            setDeleteId(null)
        }
    }

    function startEdit(worker: Worker) {
        setEditingWorker(worker)
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

            {/* Add Button */}
            <Button
                className="fixed bottom-24 right-4 h-14 w-14 rounded-2xl shadow-lg bg-emerald-600 hover:bg-emerald-700 md:static md:w-full md:h-12 md:mb-4 md:shadow-none z-40"
                onClick={() => setIsAddModalOpen(true)}
            >
                <Plus size={24} /> <span className="hidden md:inline ml-2">{t('addWorker')}</span>
            </Button>

            {/* Add Worker Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={
                    <>
                        <Plus size={20} className="text-emerald-400" /> {t('addWorker')}
                    </>
                }
            >
                <form onSubmit={handleAdd}>
                    <div className="form-group">
                        <label className="form-label">
                            <UserCircle size={18} /> {t('workerName')}
                        </label>
                        <Input
                            className="large-input bg-slate-800 border-slate-700"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={t('workerName')}
                            autoFocus
                        />
                    </div>
                    <Button type="submit" className="big-action-btn bg-emerald-600 hover:bg-emerald-700 w-full">
                        <Plus size={18} /> {t('add')}
                    </Button>
                </form>
            </Modal>

            {/* Edit Worker Modal */}
            <Modal
                isOpen={!!editingWorker}
                onClose={() => setEditingWorker(null)}
                title={
                    <>
                        <Pencil size={20} className="text-emerald-400" /> {t('editWorker')}
                    </>
                }
            >
                <form onSubmit={handleUpdate}>
                    <div className="form-group">
                        <label className="form-label">
                            <UserCircle size={18} /> {t('workerName')}
                        </label>
                        <Input
                            className="large-input bg-slate-800 border-slate-700"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder={t('workerName')}
                            autoFocus
                        />
                    </div>
                    <Button type="submit" className="big-action-btn bg-emerald-600 hover:bg-emerald-700 w-full">
                        <Save size={18} /> {t('saveChanges')}
                    </Button>
                </form>
            </Modal>

            <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-white">
                <UserCircle size={18} /> {t('workerList')}
            </h2>

            {/* Workers List */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <Card key={i} className="bg-slate-900/50 border-slate-800">
                            <CardContent className="p-4 flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-full bg-slate-800" />
                                <Skeleton className="h-5 w-32 bg-slate-800" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : workers.length === 0 ? (
                <div className="empty-state min-h-[50vh] flex flex-col items-center justify-center">
                    <div className="empty-state-icon">
                        <Users size={48} />
                    </div>
                    <div className="empty-state-text">{t('noData')}</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {workers.map(worker => (
                        <Card
                            key={worker.id}
                            className="bg-slate-900/50 border-slate-800 hover:border-emerald-500/50 transition-all duration-300 group relative overflow-hidden card-hover"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                            <CardContent className="p-3 md:p-6 flex md:flex-col items-center justify-between md:justify-center relative z-10 h-full">
                                {/* Content Wrapper */}
                                <div className="flex md:flex-col items-center gap-3 md:gap-4 min-w-0 w-full md:text-center">
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <div className="h-10 w-10 md:h-20 md:w-20 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 shadow-md border border-slate-700 group-hover:border-emerald-500/30 transition-colors">
                                            <UserCircle size={20} className="md:w-10 md:h-10" />
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 md:bottom-1 md:right-1 h-3 w-3 md:h-5 md:w-5 bg-emerald-500 rounded-full border-2 border-slate-900" />
                                    </div>

                                    {/* Info */}
                                    <div className="truncate w-full">
                                        <h3 className="font-bold text-white text-base md:text-xl truncate mb-0.5 md:mb-1">
                                            {worker.name}
                                        </h3>
                                        {/* Pending Amount */}
                                        <div className="flex items-center md:justify-center gap-1.5 text-xs md:text-sm font-medium text-emerald-400">
                                            <span> {t('pendingPayment')}{(worker.pendingAmount || 0).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex md:w-full gap-2 shrink-0 md:mt-4 md:justify-center">
                                    <button
                                        className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700/50"
                                        onClick={() => startEdit(worker)}
                                        title={t('edit')}
                                        aria-label="Edit worker"
                                    >
                                        <Pencil size={15} className="md:w-5 md:h-5" />
                                    </button>
                                    <button
                                        className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-slate-800 hover:bg-red-900/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors border border-slate-700/50 hover:border-red-900/50"
                                        onClick={() => confirmDelete(worker.id)}
                                        title={t('delete')}
                                        aria-label="Delete worker"
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
                title={t('deleteWorkerTitle')}
                description={t('deleteWorkerDesc')}
                confirmLabel={t('delete')}
                variant="danger"
            />
        </div>
    )
}
