export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export type DocumentClassificationType =
  | 'Terms of Service'
  | 'Privacy Policy'
  | 'SaaS Agreement'
  | 'Employment Contract'
  | 'NDA'
  | 'Consumer Contract'
  | 'Rental Agreement'
  | 'Legal Notice'
  | 'Other Legal Agreement'
  | 'Not a Legal Agreement';

export interface ExecutiveOverview {
  bottom_line: string;
  top_key_takeaways: string[];
}

export interface ClauseEvidence {
  original_legal_sentence: string;
  char_start: number;
  char_end: number;
  trigger_words: string[];
}

export interface ValidationReport {
  semantic_match_score: number;
  legal_meaning_preserved: boolean;
  missing_information: string | null;
  added_information: string | null;
  risk_of_misinterpretation: "Low" | "Medium" | "High";
  validation_status: "PASSED" | "FAILED";
}

export interface SemanticValidationPanel {
  semantic_match_percent: number;
  legal_meaning_kept: boolean;
  misinterpretation_risk: "Low" | "Medium" | "High";
  hallucinated_content: string;
}

export interface ClauseInterpretation {
  plain_english_summary: string;
  why_it_matters: string;
  actionable_recommendation: string;
  worst_case_impact: string;
  risk_justification: string;
}

export interface OriginalEvidence {
  exact_quote: string;
  char_start: number;
  char_end: number;
  trigger_words: string[];
}

export interface DynamicClause {
  clause_id: string;
  dynamic_title: string;
  plain_english_summary: string;
  why_it_matters: string;
  recommendation: string;
  potential_user_impact: string;
  risk_level: RiskLevel;
  risk_explanation: string;
  evidence: ClauseEvidence;
  validation: ValidationReport;
  clause_title?: string;
  risk_rating?: RiskLevel;
  original_evidence?: OriginalEvidence;
  interpretation?: ClauseInterpretation;
  semantic_validation?: SemanticValidationPanel;
}

export interface SmartActionStep {
  action_title: string;
  reasoning: string;
}

export interface AnalysisMetadata {
  detected_type: string;
  classification_confidence: number;
  overall_risk: RiskLevel;
  executive_overview: string;
  total_clauses_analyzed: number;
  executive?: ExecutiveOverview;
  overall_risk_rating?: RiskLevel;
}

export interface LegalAnalysisReport {
  metadata: AnalysisMetadata;
  smart_action_steps: SmartActionStep[];
  clauses: DynamicClause[];
}

export interface OCRMetrics {
  is_image: boolean;
  confidence: number;
  raw_ocr_text?: string;
}

export interface FileConsistencyCheck {
  matches: boolean;
  mismatch_reason?: string;
}

export interface ExtractedTextPreview {
  text: string;
  word_count: number;
  character_count: number;
  language: string;
}

export interface AnalysisPipelineStatus {
  step: number;
  total_steps: number;
  step_name: string;
  description: string;
}

export interface SavedDocument {
  id: string;
  date: string;
  documentText: string;
  category: string;
  report: LegalAnalysisReport;
  provider_title: string;
}

export interface CompareSession {
  docA: SavedDocument | null;
  docB: SavedDocument | null;
}
