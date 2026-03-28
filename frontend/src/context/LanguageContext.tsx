import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import en, { type TranslationKeys } from '../i18n/en';
import ptBR from '../i18n/pt-BR';

export type Locale = 'en' | 'pt-BR';

const TRANSLATIONS: Record<Locale, Record<TranslationKeys, string>> = {
  en,
  'pt-BR': ptBR,
};

const STORAGE_KEY = 'locale';

function loadLocale(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'en' || saved === 'pt-BR') return saved;
  // Auto-detect browser language
  const lang = navigator.language;
  if (lang.startsWith('pt')) return 'pt-BR';
  return 'en';
}

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(loadLocale);

  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLocaleState(l);
  }, []);

  const t = useCallback(
    (key: TranslationKeys) => TRANSLATIONS[locale][key],
    [locale],
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
