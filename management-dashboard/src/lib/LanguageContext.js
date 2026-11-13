"use client";
import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('en');

    // Load language from local storage on mount
    // Load language from local storage on mount
    /*
    useEffect(() => {
        const stored = localStorage.getItem('proptivio_language');
        if (stored && ['en', 'zh'].includes(stored)) {
            setLanguage(stored);
        }
    }, []);
    */

    const toggleLanguage = () => {
        const newLang = language === 'en' ? 'zh' : 'en';
        setLanguage(newLang);
        localStorage.setItem('proptivio_language', newLang);
    };

    const t = translations[language];

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
