import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import en from './en.js';

const LANGUAGE_LOADERS = {
  en: () => Promise.resolve({ default: en }),
};

export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', dir: 'ltr' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr' },
];

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState('en');
  const [translations, setTranslations] = useState(en);

  const setLocale = useCallback(async (newLocale) => {
    if (!LANGUAGE_LOADERS[newLocale]) return;
    try {
      const mod = await LANGUAGE_LOADERS[newLocale]();
      setTranslations(mod.default);
      setLocaleState(newLocale);
      const lang = LANGUAGES.find(l => l.code === newLocale);
      document.documentElement.setAttribute('dir', lang?.dir || 'ltr');
      document.documentElement.setAttribute('lang', newLocale);
    } catch (e) {
      console.error('Failed to load language:', newLocale, e);
    }
  }, []);

  const t = useCallback((key, params) => {
    let str = translations[key] || en[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return str;
  }, [translations]);

  const value = useMemo(() => ({
    locale, setLocale, t,
    dir: LANGUAGES.find(l => l.code === locale)?.dir || 'ltr',
  }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  return useContext(I18nContext);
}
