'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'
import { Card, CardContent } from '@/components/ui/card'
import { TranslationKey } from '@/lib/translations'
import { Users, Coins, FileEdit, Clock, Wallet, Watch } from 'lucide-react'

const menuItems: { href: string; icon: React.ReactNode; key: TranslationKey; gradient: string }[] = [
  { href: '/workers', icon: <Users size={28} />, key: 'workers', gradient: 'from-blue-500 to-blue-600' },
  { href: '/rates', icon: <Coins size={28} />, key: 'rates', gradient: 'from-amber-500 to-amber-600' },
  { href: '/entry', icon: <FileEdit size={28} />, key: 'entry', gradient: 'from-emerald-500 to-emerald-600' },
  { href: '/pending', icon: <Clock size={28} />, key: 'pendingWork', gradient: 'from-orange-500 to-orange-600' },
  { href: '/payments', icon: <Wallet size={28} />, key: 'payments', gradient: 'from-green-500 to-green-600' },
]

export default function HomePage() {
  const { t } = useLanguage()

  return (
    <div>
      {/* Hero Section - Mobile view shows app title, on desktop it's in nav */}
      <div className="text-center mb-6 md:hidden">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 mb-3">
          <Watch size={40} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">{t('appTitle')}</h1>
        <p className="text-slate-400 mt-1 text-sm">{t('home')}</p>
      </div>

      {/* Desktop Hero */}
      <div className="hidden md:block text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 mb-4">
          <Watch size={32} className="text-white" />
        </div>
        <p className="text-slate-400 text-base">{t('welcomeMessage')}</p>
      </div>

      {/* Menu Grid - Large touch targets on mobile */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {menuItems.map(item => (
          <Link key={item.href} href={item.href} className="no-underline">
            <Card className="cursor-pointer transition-all duration-200 active:scale-[0.98] md:hover:scale-105 bg-slate-900/50 border-slate-800 md:hover:border-emerald-500/50">
              <CardContent className="p-4 md:p-5 text-center min-h-[120px] flex flex-col items-center justify-center">
                <div className={`inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br ${item.gradient} mb-3`}>
                  <span className="text-white">{item.icon}</span>
                </div>
                <div className="text-white font-semibold text-sm md:text-base">
                  {t(item.key)}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
