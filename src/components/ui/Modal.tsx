'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: React.ReactNode
    children: React.ReactNode
    className?: string
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
    const [viewportHeight, setViewportHeight] = React.useState('100vh')

    React.useEffect(() => {
        if (!isOpen) return

        // Handle virtual keyboard on mobile
        const handleResize = () => {
            if (window.visualViewport) {
                setViewportHeight(`${window.visualViewport.height}px`)
            }
        }

        // Add body styles to prevent scroll when modal is open
        document.body.style.overflow = 'hidden'

        window.visualViewport?.addEventListener('resize', handleResize)
        handleResize()

        return () => {
            document.body.style.overflow = ''
            window.visualViewport?.removeEventListener('resize', handleResize)
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-x-0 top-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
            style={{ height: viewportHeight }}
        >
            <div
                className={cn(
                    "bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200",
                    className
                )}
            >
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800 flex-shrink-0">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                    {children}
                </div>
            </div>
        </div>
    )
}
