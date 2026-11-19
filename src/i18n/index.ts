import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './langs/en';
import frTranslation from './langs/fr';
import enAdmin from './langs/en-admin';
import frAdmin from './langs/fr-admin';

// The texts of the redesigned administration are kept apart and merged key by key
const merge = (base: any, extra: any): any =>
  Object.keys(extra).reduce(
    (acc, key) => ({
      ...acc,
      [key]:
        typeof extra[key] === 'object' && typeof base[key] === 'object' ? merge(base[key], extra[key]) : extra[key],
    }),
    { ...base },
  );

export const resources: {
  [lang: string]: { translation: any; label: string };
} = {
  en: { translation: merge(enTranslation, enAdmin), label: 'English' },
  fr: { translation: merge(frTranslation, frAdmin), label: 'Français' },
};

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources,
  lng: 'fr',
  fallbackLng: 'en',
  returnNull: false,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
