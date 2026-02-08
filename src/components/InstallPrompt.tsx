'use client'

import { useState, useEffect } from 'react'
import { X, Download, Share } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/LanguageContext'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
    const { t } = useLanguage()
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)
    const [showPrompt, setShowPrompt] = useState(false)
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

    useEffect(() => {
        // Check if iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        setIsIOS(isIOSDevice)

        // Check if already installed (standalone mode)
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true
        setIsStandalone(isStandaloneMode)

        // Check if user has dismissed the prompt before
        const dismissed = localStorage.getItem('pwa-install-dismissed')
        if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
            // Don't show for 7 days after dismissal
            return
        }

        // Show prompt after a delay if not installed
        if (!isStandaloneMode) {
            const timer = setTimeout(() => setShowPrompt(true), 3000)
            return () => clearTimeout(timer)
        }

        // Listen for beforeinstallprompt event (Chrome/Edge/Android)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }, [])

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            await deferredPrompt.prompt()
            const { outcome } = await deferredPrompt.userChoice
            if (outcome === 'accepted') {
                setShowPrompt(false)
            }
            setDeferredPrompt(null)
        }
    }

    const handleDismiss = () => {
        setShowPrompt(false)
        localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    }

    // Don't show if already installed
    if (isStandalone || !showPrompt) {
        return null
    }

    return (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl z-50 animate-in slide-in-from-bottom-4">
            <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
            >
                <X size={18} />
            </button>

            <div className="flex items-start gap-3">
                <div className="shrink-0 w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <Download size={24} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm mb-1">{t('installApp')}</h3>
                    <p className="text-xs text-slate-400 mb-3">{t('installAppDesc')}</p>

                    {isIOS ? (
                        <div className="text-xs text-slate-300 bg-slate-800/50 rounded-lg p-2">
                            <p className="flex items-center gap-1">
                                {t('iosTapShare')} <Share size={14} className="text-blue-400" /> {t('iosThenAdd')}
                            </p>
                        </div>
                    ) : (
                        <Button
                            onClick={handleInstallClick}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 h-9 text-xs font-medium"
                        >
                            <Download size={14} className="mr-1.5" /> {t('installNow')}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
