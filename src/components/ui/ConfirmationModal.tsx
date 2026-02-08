'use client'

import * as React from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'danger' | 'success' | 'warning'
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'success'
}: ConfirmationModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        {variant === 'warning' || variant === 'danger' ? (
                            <div className="bg-amber-500/10 p-3 rounded-full text-amber-500">
                                <AlertTriangle size={24} />
                            </div>
                        ) : null}
                        <div>
                            <h3 className="text-xl font-bold text-white">{title}</h3>
                        </div>
                    </div>

                    <p className="text-slate-300 mb-6 leading-relaxed">
                        {description}
                    </p>

                    <div className="flex gap-3 justify-end">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            className="bg-slate-800 hover:bg-slate-700 text-white"
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            onClick={() => {
                                onConfirm()
                                onClose()
                            }}
                            className={`${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' :
                                    variant === 'warning' ? 'bg-amber-600 hover:bg-amber-700' :
                                        'bg-emerald-600 hover:bg-emerald-700'
                                } text-white`}
                        >
                            {confirmLabel}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
