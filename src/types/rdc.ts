// Data of the DRC version, as sent by the server
export type Appreciation = 'VERY_GOOD' | 'GOOD' | 'FAIRLY_GOOD' | 'INSUFFICIENT' | 'WEAK';
export type ObserverFunction = 'INSPECTOR' | 'ADVISOR' | 'SCHOOL_HEAD' | 'PEER';

export interface RdcRegion {
  id: string;
  name: string;
  level?: number;
}

export interface RdcSchool {
  id: string;
  name: string;
  emis_number?: string;
  region_id?: string;
  region?: RdcRegion;
}

export interface RdcCoach {
  id: string;
  name: string;
  surname?: string;
  email?: string;
  phone?: string;
  sex?: string;
  function?: ObserverFunction | string;
  duty_station?: string;
  postal_box?: string;
}

export interface RdcTeacher {
  id: string;
  name: string;
  surname?: string;
  subject?: string;
  sex?: string;
  weekly_load?: number;
}

export interface RdcActivity {
  id: string;
  sub_domain?: string;
  discipline?: string;
  sheet_code?: string;
  class_name?: string;
  p_i?: string;
  time?: string;
  essential_knowledge?: string;
  display_order?: number;
}

export interface RdcSession {
  id: string;
  session_status?: string | null;
  level?: string;
  school_year?: string;
  teacher_weekly_load?: number;
  last_observation_date?: string;
  last_observation_rating?: string;
  suggested_appreciation?: Appreciation | null;
  appreciation?: Appreciation | null;
  observer_function?: string;
  start_time?: string;
  end_time?: string;
  advice?: string;
  signed_place?: string;
  observation_started_at?: string;
  observation_ended_at?: string;
  completed_at?: string;
  subject?: string;
  created_at?: string;
  updated_at?: string;
  coach?: RdcCoach;
  school?: RdcSchool;
  teacher?: RdcTeacher;
  activities?: RdcActivity[];
  // Session list only
  average_score?: number | null;
  pdp_status?: string | null;
}

export interface RdcQuestion {
  id: string;
  title: string;
  description?: string;
  tooltip_data?: string;
  type?: 'YES_NO' | 'FME' | string;
  code?: string;
  allow_na?: boolean;
  display_order?: number;
  competence_id?: string;
}

export interface RdcCompetence {
  id: string;
  title: string;
  code?: string;
  domain_code?: string;
  domain_title?: string;
  display_order?: number;
  has_global_score?: boolean;
  questions: RdcQuestion[];
}

export interface RdcChecklistItem {
  id: string;
  code: number;
  owner: 'TEACHER' | 'LEARNER' | string;
  document_name: string;
  statement: string;
  display_order?: number;
  updated_at?: string;
}

export interface RdcPdpObjective {
  id: string;
  question_id?: string | null;
  category?: string;
  rank?: number;
  objective: string;
  actions: string;
  indicator?: string;
  due_date?: string;
  origin?: string;
}

export interface DiagnosticConfig {
  strength: string[];
  consolidate: string[];
  priority: string[];
  priority_threshold: number;
  due_in_days: number;
}

export interface PdpRuleSet {
  id: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  diagnostic_config: DiagnosticConfig;
  max_objectives: number;
  published_at?: string;
  published_by_name?: string;
  created_at?: string;
  updated_at?: string;
  library_count?: number;
  pdp_count?: number;
}

export interface PdpLibraryItem {
  id?: string;
  question_id: string;
  objective?: string;
  actions?: string;
  indicator?: string;
}

export interface SessionDetails {
  session: RdcSession;
  answers: { id: string; question_id: string; value: number | null; not_applicable?: boolean }[];
  scores: { id: string; competence_id: string; value?: number | null; suggested_value?: number | null }[];
  documentations: {
    id: string;
    checklist_item_id: string;
    answer?: boolean | null;
    proposal?: string;
    filled_in_phase?: string;
  }[];
  notes: { id: string; noted_at: string; content: string }[];
  checklist: RdcChecklistItem[];
  competencies: RdcCompetence[];
  signatures: {
    id: string;
    signer_role: 'TEACHER' | 'SCHOOL_HEAD' | 'OBSERVER';
    signer_name?: string;
    signed_at?: string;
    refusal_reason?: string;
    absence_reason?: string;
    svg?: string | null;
  }[];
  pdp: {
    id: string;
    status?: string;
    validated_at?: string;
    rule_set_version?: number;
    diagnostic?: string;
    rule_set?: PdpRuleSet;
    objectives: RdcPdpObjective[];
  } | null;
}

export interface RdcDashboard {
  totals: {
    sessions: number;
    closed_sessions: number;
    teachers: number;
    observers: number;
    schools: number;
    average_score: number | null;
  };
  byFunction: { function: string; sessions: number; observers: number; teachers: number; average: number | null }[];
  byArea: { id: string; name: string; sessions: number; teachers: number; observers: number; average: number | null }[];
  bySubDomain: {
    id: string;
    code: string;
    title: string;
    average: number | null;
    count: number;
    score_1: number;
    score_2: number;
    score_3: number;
    score_4: number;
    score_5: number;
  }[];
  appreciations: { appreciation: Appreciation; count: number }[];
  months: { month: string; sessions: number }[];
  behaviours: { id: string; code: string; title: string; count: number }[];
  checklist: { id: string; code: number; document_name: string; owner: string; yes: number; no: number }[];
  pdps: { total: number; validated: number };
  learningCircles: { sessions: number; participants: number };
}

export interface LearningCircle {
  id: string;
  unit_id: string;
  evaluation?: string;
  participants?: string;
  participants_count?: number;
  created_at?: string;
  school_id: string;
  school_name: string;
  coach_id?: string;
  coach_name?: string;
}
