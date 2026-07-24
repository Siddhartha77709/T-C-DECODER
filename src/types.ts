export type RiskLevelLabel =
  | 'High Risk'
  | 'Be Careful'
  | 'Needs Attention'
  | 'Low Risk'
  | 'User Friendly'
  | 'Mostly User Friendly'
  | 'Balanced';

export type OverallRating = RiskLevelLabel;

export interface QuickMatrix {
  sells_or_monetizes_data: boolean;
  mandatory_arbitration: boolean;
  waives_class_action: boolean;
  auto_renewal_charges: boolean;
  easy_account_deletion: boolean;
}

export interface ActionableSuggestion {
  suggestion: string;
  reason: string;
}

export interface AnalyzedClause {
  clause_id: number;
  clause_title: string;
  risk_level: RiskLevelLabel | 'RED' | 'YELLOW' | 'GREEN';
  overall_clause_assessment?: RiskLevelLabel;
  exact_original_wording: string;
  exact_verbatim_quote?: string;
  trigger_words: string[];
  highlighted_evidence?: string;
  plain_english_summary: string;
  plain_english_translation?: string;
  interpretation_rationale: string;
  why_ai_summarized?: string;
  recommendation: string;
  recommendation_rationale: string;
  why_recommended?: string;
  user_impact: string;
  potential_user_impact?: string;
}

export interface AnalysisResult {
  provider_title: string;
  domain_category: string;
  overall_rating: RiskLevelLabel;
  risk_rating_label: RiskLevelLabel;
  estimated_read_time_minutes: number;
  word_count: number;
  quick_matrix: QuickMatrix;
  executive_summary: string;
  document_summary?: string;
  analyzed_clauses: AnalyzedClause[];
  clauses?: AnalyzedClause[];
  actionable_suggestions: ActionableSuggestion[];
  legal_disclaimer: string;
  raw_document_text: string;

  // Backward compatibility fields for UI mapping
  companyName: string;
  verdict: RiskLevelLabel;
  estimatedReadTime: string;
  quickNote: string;
  suggestions: ActionableSuggestion[];
}

export interface SavedDocument extends AnalysisResult {
  id: string;
  date: string;
  documentText: string;
  category: string;
}

export interface CompareSession {
  docA: SavedDocument | null;
  docB: SavedDocument | null;
}
