import i18n from '@/i18n';
import { SessionDetails } from '@/types/rdc';
import { NOT_APPLICABLE, ReportData, observationReportHtml, pdpReportHtml } from './template';

// The documents keep the French of the paper tool, whatever the language of the administration
const FUNCTION_LABELS: { [code: string]: string } = {
  INSPECTOR: 'Inspecteur.trice',
  ADVISOR: 'Conseiller.ère pédagogique',
  SCHOOL_HEAD: "Chef d'établissement",
  PEER: 'Pair (enseignant.e)',
};

const fullName = (person?: { name?: string; surname?: string } | null) =>
  [person?.name, person?.surname].filter(Boolean).join(' ');

export const toReportData = (details: SessionDetails): ReportData => {
  const { session } = details;
  const coach = session.coach;
  const parseDiagnostic = () => {
    try {
      return JSON.parse(details.pdp?.diagnostic || '[]');
    } catch {
      return [];
    }
  };
  return {
    session,
    teacher: { name: fullName(session.teacher), subject: session.teacher?.subject },
    school: { name: session.school?.name || '' },
    observer: {
      name: fullName(coach),
      phone: coach?.phone,
      email: coach?.email,
      sex: coach?.sex,
      function: FUNCTION_LABELS[session.observer_function || coach?.function || ''],
      duty_station: coach?.duty_station,
      postal_box: coach?.postal_box,
    },
    activities: [...(session.activities || [])].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
    competencies: details.competencies,
    answers: details.answers.reduce(
      (acc, answer) => ({
        ...acc,
        [answer.question_id]: answer.not_applicable ? NOT_APPLICABLE : (answer.value as number),
      }),
      {},
    ),
    scores: details.scores.reduce((acc, score) => ({ ...acc, [score.competence_id]: score.value ?? undefined }), {}),
    checklist: details.checklist,
    documentations: details.documentations.reduce(
      (acc, entry) => ({ ...acc, [entry.checklist_item_id]: entry }),
      {},
    ),
    notes: details.notes,
    signatures: details.signatures.reduce((acc, signature) => ({ ...acc, [signature.signer_role]: signature }), {}),
    pdp: details.pdp
      ? {
          pdp: details.pdp,
          objectives: details.pdp.objectives,
          ruleSet: details.pdp.rule_set,
          diagnostic: parseDiagnostic(),
        }
      : undefined,
  };
};

// Prints the document from a hidden frame; the print dialog offers "Save as PDF". Returns the
// HTML, which can also be shown as a preview.
export const reportHtml = (details: SessionDetails, kind: 'observation' | 'pdp') => {
  const data = toReportData(details);
  return kind === 'observation' ? observationReportHtml(data) : pdpReportHtml(data);
};

export const printReport = (details: SessionDetails, kind: 'observation' | 'pdp') => {
  const html = reportHtml(details, kind);
  document.getElementById('cd-print-frame')?.remove();
  const frame = document.createElement('iframe');
  frame.id = 'cd-print-frame';
  frame.title = kind;
  Object.assign(frame.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  document.body.appendChild(frame);
  const target = frame.contentWindow;
  if (!target) throw new Error(i18n.t('session-detail.print-error'));
  target.document.open();
  target.document.write(html);
  target.document.close();
  // The fonts and the signatures are drawn before the dialog opens
  setTimeout(() => {
    target.focus();
    target.print();
  }, 400);
};
