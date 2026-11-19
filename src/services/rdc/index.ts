import _axios from '..';
import {
  DiagnosticConfig,
  LearningCircle,
  PdpLibraryItem,
  PdpRuleSet,
  RdcChecklistItem,
  RdcCompetence,
  RdcDashboard,
  RdcSession,
  SessionDetails,
} from '@/types/rdc';

export type Period = { startDate?: Date; endDate?: Date };

const periodParams = (period?: Period) =>
  period?.startDate && period?.endDate
    ? { startDate: period.startDate.toJSON(), endDate: period.endDate.toJSON() }
    : {};

// Calls of the screens of the DRC administration
export const RdcService = {
  getDashboard: async (regionId?: string, period?: Period): Promise<RdcDashboard> =>
    (await _axios.get('dashboard/rdc', { params: { regionId, ...periodParams(period) } })).data,

  getSessions: async (regionId?: string): Promise<RdcSession[]> =>
    (await _axios.get('session', { params: { regionId } })).data,
  getSessionDetails: async (id: string): Promise<SessionDetails> => (await _axios.get(`session/${id}/details`)).data,

  getLearningCircles: async (regionId?: string): Promise<LearningCircle[]> =>
    (await _axios.get('tlc-evaluations', { params: { regionId } })).data,

  getGrid: async (): Promise<RdcCompetence[]> => (await _axios.get('competence')).data,
  updateCompetence: async (competence: Partial<RdcCompetence>): Promise<void> =>
    (await _axios.put('competence', competence)).data,

  getChecklist: async (): Promise<RdcChecklistItem[]> => (await _axios.get('checklist-items')).data,
  updateChecklistItem: async (id: string, item: Pick<RdcChecklistItem, 'document_name' | 'statement'>) =>
    (await _axios.put(`checklist-items/${id}`, item)).data as RdcChecklistItem,

  getRuleSets: async (): Promise<PdpRuleSet[]> => (await _axios.get('pdp/rule-sets')).data,
  getRuleSet: async (id: string): Promise<PdpRuleSet & { library: PdpLibraryItem[] }> =>
    (await _axios.get(`pdp/rule-sets/${id}`)).data,
  createDraft: async (fromId?: string): Promise<PdpRuleSet> =>
    (await _axios.post('pdp/rule-sets', { from_id: fromId })).data,
  updateDraft: async (
    id: string,
    data: { diagnostic_config?: DiagnosticConfig; max_objectives?: number; library?: PdpLibraryItem[] },
  ) => (await _axios.put(`pdp/rule-sets/${id}`, data)).data as PdpRuleSet & { library: PdpLibraryItem[] },
  publishDraft: async (id: string): Promise<PdpRuleSet> => (await _axios.post(`pdp/rule-sets/${id}/publish`)).data,
  deleteDraft: async (id: string): Promise<void> => (await _axios.delete(`pdp/rule-sets/${id}`)).data,
};

export default RdcService;
