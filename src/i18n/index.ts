import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './langs/en';
import frTranslation from './langs/fr';

export const resources: {
  [lang: string]: { translation: any; label: string };
} = {
  en: { translation: enTranslation, label: 'English' },
  fr: { translation: frTranslation, label: 'Français' },
};

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources,
  lng: 'fr',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
