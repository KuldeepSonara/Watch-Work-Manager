'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { supabase } from '@/lib/supabase'

interface Worker {
    id: string
    name: string
}

export default function WorkersPage() {
    const { t } = useLanguage()
    const [workers, setWorkers] = useState<Worker[]>([])
    const [name, setName] = useState('')
    const [editId, setEditId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')

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
            console.error('Error fetching workers:', error)
        } else {
            setWorkers(data || [])
        }
        setLoading(false)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) return

        if (editId) {
            const { error } = await supabase
                .from('workers')
                .update({ name: name.trim() })
                .eq('id', editId)

            if (error) {
                setMessage('Error updating worker')
            } else {
                setMessage('Worker updated!')
                setEditId(null)
            }
        } else {
            const { error } = await supabase
                .from('workers')
                .insert({ name: name.trim() })

            if (error) {
                setMessage('Error adding worker')
            } else {
                setMessage('Worker added!')
            }
        }

        setName('')
        fetchWorkers()
        setTimeout(() => setMessage(''), 3000)
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this worker?')) return

        const { error } = await supabase
            .from('workers')
            .delete()
            .eq('id', id)

        if (error) {
            setMessage('Error deleting worker')
        } else {
            setMessage('Worker deleted!')
            fetchWorkers()
        }
        setTimeout(() => setMessage(''), 3000)
    }

    function handleEdit(worker: Worker) {
        setEditId(worker.id)
        setName(worker.name)
    }

    return (
        <div>
            <div className="header">
                <h1>👷 {t('workers')}</h1>
            </div>

            {message && (
                <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
                    {message}
                </div>
            )}

            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">{t('workerName')}</label>
                        <input
                            type="text"
                            className="form-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('workerName')}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" className="btn btn-primary btn-block">
                            {editId ? t('edit') : t('add')} 👷
                        </button>
                        {editId && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => { setEditId(null); setName('') }}
                            >
                                {t('cancel')}
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <h2>{t('workerList')}</h2>

            {loading ? (
                <div className="text-center">{t('loading')}</div>
            ) : workers.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">👷</div>
                    <div>{t('noData')}</div>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>{t('workerName')}</th>
                                <th>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workers.map(worker => (
                                <tr key={worker.id}>
                                    <td>{worker.name}</td>
                                    <td>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.5rem 0.75rem', minHeight: 'auto', marginRight: '0.5rem' }}
                                            onClick={() => handleEdit(worker)}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            style={{ padding: '0.5rem 0.75rem', minHeight: 'auto' }}
                                            onClick={() => handleDelete(worker.id)}
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
