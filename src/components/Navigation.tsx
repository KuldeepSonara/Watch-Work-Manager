'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/LanguageContext'

export default function Navigation() {
    const pathname = usePathname()
    const { lang, setLang, t } = useLanguage()

    const links = [
        { href: '/', label: 'home', icon: '🏠' },
        { href: '/workers', label: 'workers', icon: '👷' },
        { href: '/rates', label: 'rates', icon: '💰' },
        { href: '/entry', label: 'entry', icon: '📝' },
        { href: '/pending', label: 'pending', icon: '⏳' },
        { href: '/payments', label: 'payments', icon: '💵' },
    ]

    return (
        <nav className="nav">
            {links.map(link => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={`nav-link ${pathname === link.href ? 'active' : ''}`}
                >
                    <span>{link.icon}</span> {t(link.label as keyof typeof t)}
                </Link>
            ))}
            <div style={{ marginLeft: 'auto' }} className="lang-toggle">
                <button
                    className={`lang-btn ${lang === 'gu' ? 'active' : ''}`}
                    onClick={() => setLang('gu')}
                >
                    ગુ
                </button>
                <button
                    className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                    onClick={() => setLang('en')}
                >
                    EN
                </button>
            </div>
        </nav>
    )
}
