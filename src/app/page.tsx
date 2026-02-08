'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'

export default function HomePage() {
  const { t } = useLanguage()

  const cards = [
    { href: '/workers', icon: '👷', label: 'workers' },
    { href: '/rates', icon: '💰', label: 'rates' },
    { href: '/entry', icon: '📝', label: 'entry' },
    { href: '/pending', icon: '⏳', label: 'pending' },
    { href: '/payments', icon: '💵', label: 'payments' },
  ]

  return (
    <div>
      <div className="header">
        <h1>⌚ Watch Work Manager</h1>
      </div>

      <div className="home-grid">
        {cards.map(card => (
          <Link key={card.href} href={card.href} className="home-card">
            <span className="home-card-icon">{card.icon}</span>
            <span className="home-card-title">{t(card.label as keyof typeof t)}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
