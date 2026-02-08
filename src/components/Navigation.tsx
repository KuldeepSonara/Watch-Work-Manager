'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/LanguageContext'
import { TranslationKey } from '@/lib/translations'
import { Home, Users, Coins, FileEdit, Clock, Wallet, Globe, Watch } from 'lucide-react'

const navItems: { href: string; icon: React.ReactNode; key: TranslationKey }[] = [
    { href: '/', icon: <Home size={20} />, key: 'home' },
    { href: '/workers', icon: <Users size={20} />, key: 'workers' },
    { href: '/rates', icon: <Coins size={20} />, key: 'rates' },
    { href: '/entry', icon: <FileEdit size={20} />, key: 'entry' },
    { href: '/pending', icon: <Clock size={20} />, key: 'pendingWork' },
    { href: '/payments', icon: <Wallet size={20} />, key: 'payments' },
]

export default function Navigation() {
    const pathname = usePathname()
    const { t, language, setLanguage } = useLanguage()

    return (
        <>
            {/* Desktop Top Navigation - Hidden on mobile */}
            <nav className="hidden md:block fixed top-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 z-50">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                                <Watch size={20} className="text-white" />
                            </div>
                            <span>{t('appTitle')}</span>
                        </Link>

                        {/* Nav Links */}
                        <div className="flex items-center gap-1">
                            {navItems.slice(1).map(item => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${isActive
                                                ? 'text-emerald-400 bg-emerald-400/10'
                                                : 'text-slate-300 hover:text-white hover:bg-slate-800'
                                            }`}
                                    >
                                        {item.icon}
                                        <span className="text-sm font-medium">{t(item.key)}</span>
                                    </Link>
                                )
                            })}

                            {/* Language Toggle */}
                            <button
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all ml-2"
                                onClick={() => setLanguage(language === 'en' ? 'gu' : 'en')}
                            >
                                <Globe size={20} />
                                <span className="text-sm font-medium">{language === 'en' ? 'ગુજરાતી' : 'English'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Navigation - Visible only on mobile */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 z-50 safe-area-bottom">
                <div className="flex justify-around items-center h-16 px-1">
                    {navItems.slice(0, 5).map(item => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center py-2 px-2 min-w-[60px] rounded-xl transition-all duration-200 ${isActive
                                        ? 'text-emerald-400 bg-emerald-400/10'
                                        : 'text-slate-400 active:text-white active:bg-slate-800'
                                    }`}
                            >
                                <div className={`${isActive ? 'scale-110' : ''} transition-transform`}>
                                    {item.icon}
                                </div>
                                <span className="text-[10px] mt-1 font-medium truncate">{t(item.key)}</span>
                            </Link>
                        )
                    })}

                    {/* Language Toggle for Mobile */}
                    <button
                        className="flex flex-col items-center justify-center py-2 px-2 min-w-[60px] rounded-xl text-slate-400 active:text-white active:bg-slate-800 transition-all"
                        onClick={() => setLanguage(language === 'en' ? 'gu' : 'en')}
                    >
                        <Globe size={20} />
                        <span className="text-[10px] mt-1 font-medium">
                            {language === 'en' ? 'ગુ' : 'EN'}
                        </span>
                    </button>
                </div>
            </nav>
        </>
    )
}
