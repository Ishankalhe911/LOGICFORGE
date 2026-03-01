export type MistakeTag =
  | "missed_edge_case"
  | "off_by_one_error"
  | "incorrect_loop_boundary"
  | "unnecessary_nested_loop"
  | "base_condition_flaw"
  | "redundant_computation";

export interface DetectedMistake {
  tag: MistakeTag;
  confidence_score: number;
  reasoning_summary: string;
  line_reference: string | null;
}

export interface AnalysisResult {
  detected_mistakes: DetectedMistake[];
  clean_tags: MistakeTag[];
}

export interface SubmitRequest {
  user_id: string;
  session_num: number;
  problem_id: string;
  code: string;
  language: string;
}

export interface SubmitResponse {
  user_id: string;
  session_num: number;
  problem_id: string;
  analysis: AnalysisResult;
  next_problem_id: string | null;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  target_tags: MistakeTag[];
  domain: string;
}

export interface Session {
  session_num: number;
  problem_id: string;
  clean_tags: MistakeTag[];
  submitted_at: string;
}

export interface SessionsResponse {
  user_id: string;
  total_sessions: number;
  sessions: Session[];
}

export interface RecurrenceEntry {
  sessions: Record<number, number>;
  recurrence_rate: number;
  trend: "improving" | "worsening" | "stable";
  first_seen: number | null;
  last_seen: number | null;
}

export interface AnalyticsResponse {
  user_id: string;
  dominant_weakness: MistakeTag | null;
  recurrence_data: Record<string, RecurrenceEntry>;
  extinction_report: {
    extinguished: string[];
    active: string[];
    latest_session: number;
  };
}