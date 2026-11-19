import i18n from '@/i18n';
import { RdcSession } from '@/types/rdc';

// Labels of the codes of the DRC version, in the language of the administration
export const APPRECIATIONS = ['VERY_GOOD', 'GOOD', 'FAIRLY_GOOD', 'INSUFFICIENT', 'WEAK'] as const;
export const FUNCTIONS = ['INSPECTOR', 'ADVISOR', 'SCHOOL_HEAD', 'PEER'] as const;

export const appreciationLabel = (code?: string | null) => (code ? i18n.t(`rdc.appreciations.${code}`) : '—');
export const functionLabel = (code?: string | null) =>
  code ? i18n.t(`rdc.functions.${code}`, { defaultValue: code }) : i18n.t('rdc.functions.UNKNOWN');

export const fullName = (person?: { name?: string; surname?: string } | null) =>
  [person?.name, person?.surname].filter(Boolean).join(' ') || '—';

// Sessions of the first version have no status: they were closed
export const isClosed = (session: RdcSession) =>
  !session.session_status || session.session_status.toUpperCase() === 'COMPLETED';

export const sessionStatus = (session: RdcSession) =>
  isClosed(session) ? 'COMPLETED' : (session.session_status || '').toUpperCase();

export const formatDate = (value?: string | Date | null, withTime = false) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
};

export const formatNumber = (value?: number | null, digits = 1) =>
  value === null || value === undefined
    ? '—'
    : value.toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-GB', { maximumFractionDigits: digits });
