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
            {/* Desktop Top Navigation */}
            <nav className="hidden md:block fixed top-0 left-0 right-0 h-20 bg-slate-950/80 backdrop-blur-md border-b border-white/5 z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                    {/* Logo & Brand */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300">
                            <Watch size={22} className="text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-bold text-lg tracking-tight leading-none group-hover:text-emerald-400 transition-colors">
                                {t('appTitle')}
                            </span>
                            <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">
                                Management System
                            </span>
                        </div>
                    </Link>

                    {/* Nav Links & Actions */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/5 backdrop-blur-sm">
                            {navItems.slice(1).map(item => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${isActive
                                            ? 'text-white bg-emerald-600 shadow-md shadow-emerald-500/20'
                                            : 'text-slate-400 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        <div className={isActive ? "" : "opacity-70"}>{item.icon}</div>
                                        <span className="text-sm font-medium">{t(item.key)}</span>
                                    </Link>
                                )
                            })}
                        </div>

                        <div className="w-px h-8 bg-white/10 mx-2"></div>

                        <button
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
                            onClick={() => setLanguage(language === 'en' ? 'gu' : 'en')}
                        >
                            <Globe size={18} className="text-emerald-400" />
                            <span className="text-sm font-medium">{language === 'en' ? t('gujarati') : t('english')}</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Top Header - Replaces Floating Button */}
            <nav className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950/80 backdrop-blur-md border-b border-white/5 z-50 flex items-center justify-between px-4 safe-area-top">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Watch size={20} className="text-white" />
                    </div>
                    <span className="text-white font-bold text-base truncate max-w-[180px]">
                        {t('appTitle')}
                    </span>
                </Link>

                <button
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 border border-slate-800 text-white active:scale-95 transition-all"
                    onClick={() => setLanguage(language === 'en' ? 'gu' : 'en')}
                >
                    <span className="font-bold text-xs">
                        {language === 'en' ? 'ગુ' : 'EN'}
                    </span>
                </button>
            </nav>

            {/* Mobile Bottom Navigation - Floating Island Style */}
            <nav className="md:hidden fixed bottom-4 left-2 right-2 sm:left-6 sm:right-6 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 z-50 safe-area-bottom">
                <div className="flex justify-between items-center h-16 px-1">
                    {navItems.map(item => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1 relative group ${isActive
                                    ? 'text-emerald-400'
                                    : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {isActive && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 sm:w-12 h-1 bg-emerald-500 rounded-b-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                                )}
                                <div className={`mb-0.5 transition-all duration-300 ${isActive ? '-translate-y-1 scale-110' : 'group-hover:-translate-y-0.5'}`}>
                                    {item.icon}
                                </div>
                                <span className={`text-[10px] font-medium leading-none transition-colors truncate w-full text-center px-0.5 ${isActive ? 'text-emerald-400 opacity-100' : 'text-slate-500 opacity-0 group-hover:opacity-100'}`}>
                                    {t(item.key)}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </>
    )
}
