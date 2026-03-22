import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import en from './en.js';

const LANGUAGE_LOADERS = {
  en: () => Promise.resolve({ default: en }),
  es: () => import('./es.js'),
  fr: () => import('./fr.js'),
  de: () => import('./de.js'),
  zh: () => import('./zh.js'),
  hi: () => import('./hi.js'),
  pt: () => import('./pt.js'),
  ar: () => import('./ar.js'),
  ja: () => import('./ja.js'),
  ko: () => import('./ko.js'),
  it: () => import('./it.js'),
  ru: () => import('./ru.js'),
};

export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Espa\u00f1ol', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Fran\u00e7ais', dir: 'ltr' },
  { code: 'zh', name: 'Chinese', nativeName: '\u4e2d\u6587', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: '\u0939\u093f\u0928\u094d\u0926\u0940', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Portugu\u00eas', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629', dir: 'rtl' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '\u65e5\u672c\u8a9e', dir: 'ltr' },
  { code: 'ko', name: 'Korean', nativeName: '\ud55c\uad6d\uc5b4', dir: 'ltr' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', dir: 'ltr' },
  { code: 'ru', name: 'Russian', nativeName: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439', dir: 'ltr' },
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
