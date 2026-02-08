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

const DEFAULT_TASKS = [
    { task_number: 1, task_name: 'Crown fitting' },
    { task_number: 2, task_name: 'Strap fitting' },
    { task_number: 3, task_name: 'Lock / buckle fitting' },
    { task_number: 4, task_name: 'Protective packaging' },
    { task_number: 5, task_name: 'Box making' },
    { task_number: 6, task_name: 'Final boxing (25 watches per box)' },
]

export default function RatesPage() {
    const { t, lang } = useLanguage()
    const [rates, setRates] = useState<TaskRate[]>([])
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const [editRates, setEditRates] = useState<{ [key: number]: string }>({})

    useEffect(() => {
        fetchRates()
    }, [])

    async function fetchRates() {
        setLoading(true)
        const { data, error } = await supabase
            .from('task_rates')
            .select('*')
            .order('task_number')

        if (error) {
            console.error('Error fetching rates:', error)
        } else if (data && data.length > 0) {
            setRates(data)
            const rateMap: { [key: number]: string } = {}
            data.forEach(r => { rateMap[r.task_number] = r.rate.toString() })
            setEditRates(rateMap)
        } else {
            // Initialize default tasks if none exist
            await initializeDefaultRates()
        }
        setLoading(false)
    }

    async function initializeDefaultRates() {
        const inserts = DEFAULT_TASKS.map(task => ({
            ...task,
            rate: 0
        }))

        const { error } = await supabase
            .from('task_rates')
            .insert(inserts)

        if (!error) {
            fetchRates()
        }
    }

    function getTaskLabel(taskNumber: number): string {
        const key = `task${taskNumber}` as keyof typeof t
        return t(key)
    }

    async function handleSave(taskNumber: number) {
        const rate = parseFloat(editRates[taskNumber] || '0')

        const { error } = await supabase
            .from('task_rates')
            .update({ rate })
            .eq('task_number', taskNumber)

        if (error) {
            setMessage('Error saving rate')
        } else {
            setMessage('Rate saved!')
            fetchRates()
        }
        setTimeout(() => setMessage(''), 3000)
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

            {loading ? (
                <div className="text-center">{t('loading')}</div>
            ) : (
                <div>
                    {[1, 2, 3, 4, 5, 6].map(taskNum => (
                        <div key={taskNum} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '150px' }}>
                                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                                        {t('taskNumber')} {taskNum}
                                    </div>
                                    <div style={{ fontWeight: 600 }}>
                                        {getTaskLabel(taskNum)}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>₹</span>
                                        <input
                                            type="number"
                                            className="form-input"
                                            style={{ width: '120px', paddingLeft: '1.75rem' }}
                                            value={editRates[taskNum] || ''}
                                            onChange={(e) => setEditRates({ ...editRates, [taskNum]: e.target.value })}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                        />
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleSave(taskNum)}
                                    >
                                        {t('save')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
