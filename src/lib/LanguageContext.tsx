'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Language, TranslationKey } from './translations'

interface LanguageContextType {
    lang: Language
    language: Language
    setLang: (lang: Language) => void
    setLanguage: (lang: Language) => void
    t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLang] = useState<Language>('gu') // Default Gujarati

    useEffect(() => {
        const saved = localStorage.getItem('language') as Language
        if (saved && (saved === 'en' || saved === 'gu')) {
            setLang(saved)
        }
    }, [])

    const handleSetLang = (newLang: Language) => {
        setLang(newLang)
        localStorage.setItem('language', newLang)
    }

    const t = (key: TranslationKey): string => {
        return translations[lang][key] || key
    }

    return (
        <LanguageContext.Provider value={{ lang, language: lang, setLang: handleSetLang, setLanguage: handleSetLang, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider')
    }
    return context
}
