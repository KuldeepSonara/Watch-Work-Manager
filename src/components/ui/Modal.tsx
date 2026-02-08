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
    const [viewportHeight, setViewportHeight] = React.useState('100dvh')
    const [viewportOffset, setViewportOffset] = React.useState(0)
    const scrollPositionRef = React.useRef(0)

    React.useEffect(() => {
        if (!isOpen) return

        // Store scroll position
        scrollPositionRef.current = window.scrollY

        // Handle virtual keyboard on mobile (especially Safari)
        const handleResize = () => {
            if (window.visualViewport) {
                const vh = window.visualViewport.height
                const offset = window.visualViewport.offsetTop
                setViewportHeight(`${vh}px`)
                setViewportOffset(offset)
            }
        }

        // Prevent body scroll and fix position
        const scrollY = window.scrollY
        document.body.style.position = 'fixed'
        document.body.style.top = `-${scrollY}px`
        document.body.style.left = '0'
        document.body.style.right = '0'
        document.body.style.overflow = 'hidden'

        window.visualViewport?.addEventListener('resize', handleResize)
        window.visualViewport?.addEventListener('scroll', handleResize)
        handleResize()

        return () => {
            // Restore scroll position
            document.body.style.position = ''
            document.body.style.top = ''
            document.body.style.left = ''
            document.body.style.right = ''
            document.body.style.overflow = ''
            window.scrollTo(0, scrollPositionRef.current)
            window.visualViewport?.removeEventListener('resize', handleResize)
            window.visualViewport?.removeEventListener('scroll', handleResize)
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-x-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
            style={{
                height: viewportHeight,
                top: viewportOffset
            }}
        >
            <div
                className={cn(
                    "bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] sm:max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200",
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
