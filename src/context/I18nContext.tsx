import { createContext, useContext, useState, ReactNode } from 'react';
import type { Language } from '../types';

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (en: string, ru: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('pm_lang');
    return (saved as Language) || 'en';
  });

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('pm_lang', newLang);
  };

  const t = (en: string, ru: string) => lang === 'en' ? en : ru;

  return (
    <I18nContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
