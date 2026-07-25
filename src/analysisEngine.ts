import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  LegalAnalysisReport,
  DynamicClause,
  ClauseEvidence,
  ValidationReport,
  SmartActionStep,
  OCRMetrics,
  RiskLevel,
  DocumentClassificationType,
  ExecutiveOverview,
  ClauseInterpretation,
  OriginalEvidence,
  SemanticValidationPanel
} from './types';
import { verifyFileConsistency } from './fileExtractor';

const MANDATORY_DISCLAIMER =
  "T&C Decoder provides automated AI-generated summaries for informational purposes only. This report does not constitute professional legal advice. Please consult a qualified legal professional for specific concerns.";

const REJECTED_NON_LEGAL_NOTICE =
  "This document does not appear to be a legal agreement. Please upload a Terms of Service, Terms & Conditions, Privacy Policy or another supported legal document.";

const PIPELINE_STEP_NAMES = [
  "Receive & Extract Text",
  "Normalize & Display Preview",
  "File Consistency Check",
  "Document Classification & Input Validation",
  "Dynamic Document Segmentation",
  "Dynamic Clause Title Generation",
  "Plain-English Summarization",
  "Real-World Impact Analysis",
  "Actionable Recommendations",
  "Risk Rating",
  "Traceability & Evidence Mapping",
  "AI Semantic Validation Check"
];

export function getPipelineStepName(step: number): string {
  return PIPELINE_STEP_NAMES[step - 1] || `Step ${step}`;
}

export function getPipelineStepDescription(step: number): string {
  const descriptions: Record<number, string> = {
    1: "Extracting raw text from uploaded document source",
    2: "Standardizing formatting and preparing character-for-character preview",
    3: "Verifying Uploaded File Content == Extracted Text == LLM Input",
    4: "Classifying document type and enforcing legal agreement guardrail",
    5: "Splitting document into logical semantic sections",
    6: "Generating unique clause titles from actual section contents",
    7: "Rewriting clauses at Grade 7-8 reading level without legal jargon",
    8: "Assessing real-world practical consequences for ordinary users",
    9: "Generating context-specific actionable recommendations",
    10: "Classifying risk level with justification",
    11: "Mapping verbatim evidence with character index positions",
    12: "Validating AI summary against source for semantic accuracy"
  };
  return descriptions[step] || "Processing";
}

export { MANDATORY_DISCLAIMER, REJECTED_NON_LEGAL_NOTICE };

export const INVALID_DOCUMENT_TYPE_WARNING =
  "Invalid Document Type: Please upload or paste a valid Terms & Conditions or Legal Agreement document to analyze.";

const LEGAL_DOCUMENT_SIGNAL_KEYWORDS: string[] = [
  'terms of service', 'terms and conditions', 'terms & conditions', 'terms of use',
  'privacy policy', 'privacy statement', 'data protection policy', 'cookie policy',
  'saas agreement', 'software as a service', 'service level agreement',
  'non-disclosure agreement', 'confidentiality agreement', 'nda',
  'employment agreement', 'employment contract', 'offer letter',
  'rental agreement', 'lease agreement', 'tenancy agreement', 'lease',
  'consumer contract', 'purchase agreement', 'sales agreement', 'terms of sale',
  'legal notice', 'legal agreement', 'user agreement', 'end user license agreement', 'eula',
  'acceptable use policy', 'community guidelines',
  'arbitration', 'governing law', 'jurisdiction', 'indemnification', 'indemnify', 'liability',
  'hereby agree', 'the parties', 'binding agreement', 'third party beneficiaries',
  'intellectual property', 'copyright', 'trademark',
  'termination', 'terminate', 'confidentiality', 'data processing', 'cookies',
  'disclaimer of warranties', 'limitation of liability', 'force majeure',
  'entire agreement', 'severability', 'assignment', 'warranties'
];

const NON_LEGAL_SIGNAL_KEYWORDS: string[] = [
  'dear sir', 'dear madam', 'cv', 'curriculum vitae', 'resume',
  'meeting minutes', 'agenda', 'to-do list', 'grocery list', 'shopping list',
  'poem', 'short story', 'the poem', 'chapter 1', 'once upon a time',
  'weather forecast', 'news article', 'recipe', 'ingredients:',
  'flight itinerary', 'hotel confirmation', 'invoice',
  'best regards', 'yours sincerely', 'yours faithfully',
  'homework', 'assignment', 'exam',
  'devops roadmap', 'roadmap', 'sprint plan', 'release plan',
  'technical guide', 'design doc', 'rfc', 'architecture',
  'table of contents', 'chapter', 'exercise', 'quiz',
  'product roadmap', 'quarterly roadmap', 'engineering roadmap',
  'technical specification', 'api documentation', 'developer guide',
  'skills:', 'experience:', 'education:', 'work history',
  'executive summary', 'business plan', 'marketing plan'
];

function countWordHits(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) hits++;
  }
  return hits;
}

export function clientSideLooksLikeLegalDocument(text: string): { ok: boolean; reason?: string } {
  const cleaned = (text || '').trim();
  if (!cleaned) return { ok: false, reason: 'Empty text provided.' };

  const words = cleaned.split(/\s+/).filter(Boolean).length;
  if (words < 40) return { ok: false, reason: 'Document too short (< 40 words) to validate as legal agreement.' };

  const legalHits = countWordHits(cleaned, LEGAL_DOCUMENT_SIGNAL_KEYWORDS);
  const nonLegalHits = countWordHits(cleaned, NON_LEGAL_SIGNAL_KEYWORDS);

  if (nonLegalHits >= 1 && legalHits === 0) return { ok: false, reason: 'Document appears to be non-legal content.' };
  if (legalHits >= 2 && legalHits > nonLegalHits) return { ok: true };
  if (nonLegalHits > 0 && nonLegalHits > legalHits) return { ok: false, reason: 'Document appears to be non-legal content.' };
  if (legalHits >= 3) return { ok: true };
  if (nonLegalHits >= 1 && legalHits === 0) return { ok: false, reason: 'Document appears to be non-legal content.' };

  return { ok: false, reason: 'AMBIGUOUS' };
}

export async function quickValidateLegalDocument(
  text: string,
  onPipelineStep?: (step: number) => void
): Promise<{ ok: boolean; reason?: string }> {
  const fast = clientSideLooksLikeLegalDocument(text);
  if (fast.ok) return { ok: true };
  if (fast.reason && fast.reason !== 'AMBIGUOUS') return { ok: false, reason: fast.reason };

  const configuredKey = getGeminiApiKeyOrEmpty();
  if (!configuredKey) {
    return { ok: false, reason: 'Ambiguous content classification and no Gemini API key configured.' };
  }

  const apiKey = configuredKey;

  const validationPrompt = `Answer with ONLY a JSON object like: {"is_legal_agreement": true_or_boolean, "justification": "one short sentence"}.
Classify the following text snippet. Return is_legal_agreement = TRUE only if the text appears to be a Terms of Service, Terms & Conditions, Privacy Policy, SaaS Agreement, NDA, Employment Contract, Consumer Contract, Rental/Lease Agreement, Legal Notice, or other legally binding user-to-company or party-to-party contract.
Return FALSE for personal letters, resumes, essays, fiction, recipes, homework, meeting minutes, emails, news articles, shopping lists, poetry, invoices, flight itineraries, travel confirmations, or any non-legal text.

TEXT SNIPPET (first 3500 chars):
"""${(text || '').trim().slice(0, 3500)}"""
`;

  firePipelineStep(4, onPipelineStep);

  try {
    const sdkResult = await generateContentWithSdkRetry(
      apiKey,
      validationPrompt,
      {
        responseMimeType: "application/json",
        temperature: 0.1,
        topP: 0.95,
        maxOutputTokens: 256,
      },
      'quickValidateLegalDocument'
    );

    const outputText = sdkResult?.response?.text() || '';
    if (!outputText || typeof outputText !== 'string') {
      return { ok: true, reason: 'Pre-validation returned empty response; proceeding to full analysis.' };
    }
    const cleaned = outputText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    let parsed: { is_legal_agreement?: boolean; justification?: string } = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const fallbackBool = cleaned.toLowerCase().includes('true') && !cleaned.toLowerCase().includes('"is_legal_agreement": false');
      return {
        ok: fallbackBool,
        reason: fallbackBool ? 'Classification ambiguous; defaulting to proceed.' : 'Classification parse failure; blocking as unsafe.'
      };
    }

    const isLegal = parsed.is_legal_agreement === true;
    return {
      ok: isLegal,
      reason: isLegal ? (parsed.justification || 'Classification passed.') : (parsed.justification || 'Document classified as non-legal.')
    };
  } catch (err) {
    if (err instanceof Error) {
      const msg = err.message || '';
      if (/429|rate.?limit|RESOURCE_EXHAUSTED/i.test(msg)) {
        console.warn('[Gemini SDK] quickValidateLegalDocument: rate-limited, allowing pipeline to proceed to full analysis.', {
          model: GEMINI_MODEL,
          rawError: err,
        });
        return { ok: true, reason: 'Pre-validation skipped due to API rate limits; proceeding to full analysis.' };
      }
      if (/401|403|authentication|api.?key|permission/i.test(msg)) {
        console.error('[Gemini SDK] quickValidateLegalDocument auth failure.', {
          model: GEMINI_MODEL,
          rawError: err,
        });
        throw err;
      }
      if (/404|not.?found/i.test(msg)) {
        console.error('[Gemini SDK] quickValidateLegalDocument 404 model failure.', {
          model: GEMINI_MODEL,
          rawError: err,
        });
        throw err;
      }
      console.warn('[Gemini SDK] quickValidateLegalDocument transient API error, allowing full analysis to attempt.', {
        model: GEMINI_MODEL,
        rawError: err,
      });
      return { ok: true, reason: 'Pre-validation inconclusive due to API error; proceeding to full analysis.' };
    }
    throw new Error(`Pre-validation failed: ${String(err)}`);
  }
}

function validateClauseRiskLevel(value: unknown): RiskLevel {
  if (value === "Critical" || value === "High" || value === "Medium" || value === "Low") {
    return value as RiskLevel;
  }
  return "Low";
}

function validateMisinterpretationRisk(value: unknown): ValidationReport["risk_of_misinterpretation"] {
  if (value === "High" || value === "Medium" || value === "Low") {
    return value as ValidationReport["risk_of_misinterpretation"];
  }
  return "Low";
}

function validateDetectedType(value: unknown): DocumentClassificationType {
  const validTypes: DocumentClassificationType[] = [
    'Terms of Service',
    'Privacy Policy',
    'SaaS Agreement',
    'Employment Contract',
    'NDA',
    'Consumer Contract',
    'Rental Agreement',
    'Legal Notice',
    'Other Legal Agreement',
    'Not a Legal Agreement'
  ];
  if (typeof value === 'string' && validTypes.includes(value as DocumentClassificationType)) {
    return value as DocumentClassificationType;
  }
  return 'Other Legal Agreement';
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface RawOriginalEvidence {
  exact_quote?: string;
  char_start?: number;
  char_end?: number;
  trigger_words?: string[];
}

interface RawClauseInterpretation {
  plain_english_summary?: string;
  why_it_matters?: string;
  actionable_recommendation?: string;
  worst_case_impact?: string;
  risk_justification?: string;
}

interface RawSemanticValidationPanel {
  semantic_match_percent?: number;
  legal_meaning_kept?: boolean;
  misinterpretation_risk?: string;
  hallucinated_content?: string;
}

interface RawClauseEvidence {
  original_legal_sentence?: string;
  char_start?: number;
  char_end?: number;
  trigger_words?: string[];
}

interface RawValidationReport {
  semantic_match_score?: number;
  legal_meaning_preserved?: boolean;
  missing_information?: string | string[] | null;
  added_information?: string | string[] | null;
  risk_of_misinterpretation?: string;
  validation_status?: string;
}

interface RawDynamicClause {
  clause_id?: string;
  dynamic_title?: string;
  plain_english_summary?: string;
  why_it_matters?: string;
  recommendation?: string;
  potential_user_impact?: string;
  risk_level?: string;
  risk_explanation?: string;
  evidence?: RawClauseEvidence;
  validation?: RawValidationReport;
  clause_title?: string;
  risk_rating?: string;
  original_evidence?: RawOriginalEvidence;
  interpretation?: RawClauseInterpretation;
  semantic_validation?: RawSemanticValidationPanel;
}

interface RawSmartActionStep {
  action_title?: string;
  reasoning?: string;
}

interface RawExecutiveOverview {
  bottom_line?: string;
  top_key_takeaways?: string[];
}

interface RawAnalysisMetadata {
  detected_type?: string;
  classification_confidence?: number;
  overall_risk?: string;
  executive_overview?: string;
  total_clauses_analyzed?: number;
  executive?: RawExecutiveOverview;
  overall_risk_rating?: string;
}

interface RawReport {
  metadata?: RawAnalysisMetadata;
  smart_action_steps?: RawSmartActionStep[];
  clauses?: RawDynamicClause[];
  executive_overview?: RawExecutiveOverview;
  overall_risk_rating?: string;
}

const VITE_GEMINI_API_KEY: string =
  (typeof import.meta !== 'undefined' && import.meta?.env && typeof import.meta.env.VITE_GEMINI_API_KEY === 'string')
    ? import.meta.env.VITE_GEMINI_API_KEY
    : '';

const GEMINI_API_KEY_MISSING_ERROR =
  'Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your local .env file and restart the dev server.';

function getGeminiApiKeyOrThrow(context?: string): string {
  const key = (VITE_GEMINI_API_KEY || '').trim();
  if (!key) {
    const ctx = context ? ` [${context}]` : '';
    const err = new Error(GEMINI_API_KEY_MISSING_ERROR + ctx);
    console.error('[Gemini Config] API key missing.', {
      hasImportMetaEnv: typeof import.meta !== 'undefined' && !!import.meta?.env,
      keyLength: VITE_GEMINI_API_KEY.length,
      context: context || '(none)',
    });
    throw err;
  }
  return key;
}

function getGeminiApiKeyOrEmpty(): string {
  return (VITE_GEMINI_API_KEY || '').trim();
}

const RETRY_MAX_ATTEMPTS = 4;
const RETRY_WAIT_MS = 4000;
const GEMINI_MODEL = 'gemini-3.6-flash';
const CLAUSE_BATCH_CONCURRENCY = 3;

async function delay(ms: number): Promise<void> {
  await new Promise<void>(r => setTimeout(r, ms));
}

function retryBackoffMs(attempt: number): number {
  const multiplier = 2 ** Math.max(0, attempt - 1);
  return RETRY_WAIT_MS * multiplier;
}

function firePipelineStep(step: number, onPipelineStep?: (step: number) => void): void {
  if (onPipelineStep) onPipelineStep(step);
}

function isSdkError429(err: unknown): boolean {
  if (!err) return false;
  const asErr = err as { status?: number; message?: string; code?: number };
  if (asErr.status === 429) return true;
  if (asErr.code === 429) return true;
  if (typeof asErr.message === 'string' && /429|RESOURCE_EXHAUSTED|rate.?limit/i.test(asErr.message)) return true;
  return false;
}

function isSdkError404(err: unknown): boolean {
  if (!err) return false;
  const asErr = err as { status?: number; message?: string; code?: number };
  if (asErr.status === 404) return true;
  if (asErr.code === 404) return true;
  if (typeof asErr.message === 'string' && /404|not.?found/i.test(asErr.message)) return true;
  return false;
}

function isSdkErrorAuth(err: unknown): boolean {
  if (!err) return false;
  const asErr = err as { status?: number; message?: string; code?: number };
  if (asErr.status === 401 || asErr.status === 403) return true;
  if (asErr.code === 401 || asErr.code === 403) return true;
  if (typeof asErr.message === 'string' && /401|403|unauthorized|permission|authentication|api.?key/i.test(asErr.message)) return true;
  return false;
}

function maskedKey(key: string): string {
  const k = key || '';
  if (k.length <= 8) return '***';
  return `${k.slice(0, 4)}***${k.slice(-4)}`;
}

function createGenAIClient(apiKey: string): GoogleGenerativeAI {
  const safeKey = (apiKey || '').trim();
  if (!safeKey) {
    const errMsg = 'Gemini API key is not configured in the application environment.';
    console.error('[Gemini SDK] Abort: empty API key.', {
      model: GEMINI_MODEL,
      keyProvided: !!safeKey,
    });
    throw new Error(errMsg);
  }
  return new GoogleGenerativeAI(safeKey);
}

async function generateContentWithSdkRetry(
  apiKey: string,
  promptText: string,
  generationConfig: {
    responseMimeType?: string;
    temperature?: number;
    topP?: number;
    maxOutputTokens?: number;
  },
  contextLabel: string
): Promise<ReturnType<ReturnType<GoogleGenerativeAI["getGenerativeModel"]>["generateContent"]>> {
  const safeKey = (apiKey || '').trim();
  const genAI = createGenAIClient(safeKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      responseMimeType: generationConfig.responseMimeType,
      temperature: generationConfig.temperature,
      topP: generationConfig.topP,
      maxOutputTokens: generationConfig.maxOutputTokens,
    },
  });

  let lastError: unknown = null;
  for (let attempt = 1; attempt <= RETRY_MAX_ATTEMPTS; attempt++) {
    try {
      const result = await model.generateContent(promptText);
      const resp = result?.response;
      const promptFeedback = (resp as unknown as { promptFeedback?: { blockReason?: string } } | undefined)?.promptFeedback;
      if (promptFeedback?.blockReason) {
        console.warn(`[Gemini SDK] ${contextLabel} prompt blocked on attempt ${attempt}`, {
          model: GEMINI_MODEL,
          context: contextLabel,
          blockReason: promptFeedback.blockReason,
          keyMasked: maskedKey(safeKey),
        });
      }
      return result;
    } catch (err) {
      lastError = err;

      const urlHint = `(SDK-managed: models/${GEMINI_MODEL}:generateContent via @google/generative-ai)`;
      console.error(`[Gemini SDK] ${contextLabel} attempt ${attempt}/${RETRY_MAX_ATTEMPTS} FAILED`, {
        model: GEMINI_MODEL,
        context: contextLabel,
        attempt,
        maxAttempts: RETRY_MAX_ATTEMPTS,
        endpointUrlHint: urlHint,
        keyMasked: maskedKey(safeKey),
        errorObject: err,
        errorMessage: err instanceof Error ? err.message : String(err),
        errorStack: err instanceof Error ? err.stack : undefined,
      });

      if (isSdkError404(err)) {
        const msg = `Gemini API endpoint returned HTTP 404 for model '${GEMINI_MODEL}'. Please verify model name is a valid published Gemini model identifier. [Endpoint: ${urlHint}]`;
        console.error('[Gemini SDK] 404 FATAL — aborting retries.', {
          model: GEMINI_MODEL,
          endpointUrlHint: urlHint,
          rawError: err,
          keyMasked: maskedKey(safeKey),
        });
        throw new Error(msg);
      }
      if (isSdkErrorAuth(err)) {
        const msg = 'Gemini API authentication failed. Please verify the environment configuration.';
        console.error('[Gemini SDK] AUTH FATAL — aborting retries.', {
          model: GEMINI_MODEL,
          rawError: err,
          keyMasked: maskedKey(safeKey),
        });
        throw new Error(msg);
      }
      if (isSdkError429(err)) {
        if (attempt < RETRY_MAX_ATTEMPTS) {
          const wait = retryBackoffMs(attempt);
          console.warn(`[Gemini SDK] ${contextLabel} hit 429 rate limit. Retrying in ${wait}ms ...`, {
            model: GEMINI_MODEL,
            attempt,
            nextRetryAfterMs: wait,
            keyMasked: maskedKey(safeKey),
          });
          await delay(wait);
          continue;
        }
        const msg = `Gemini API rate limit exceeded after ${RETRY_MAX_ATTEMPTS} retries (429 RESOURCE_EXHAUSTED). Please wait 1-2 minutes and try again.`;
        console.error('[Gemini SDK] Rate limit exhausted — aborting retries.', {
          model: GEMINI_MODEL,
          rawError: err,
          attempts: RETRY_MAX_ATTEMPTS,
          keyMasked: maskedKey(safeKey),
        });
        throw new Error(msg);
      }

      if (attempt < RETRY_MAX_ATTEMPTS) {
        const wait = retryBackoffMs(attempt);
        console.warn(`[Gemini SDK] ${contextLabel} transient error on attempt ${attempt}. Retrying in ${wait}ms ...`, {
          model: GEMINI_MODEL,
          attempt,
          nextRetryAfterMs: wait,
          rawError: err,
          keyMasked: maskedKey(safeKey),
        });
        await delay(wait);
        continue;
      }
      throw err;
    }
  }
  if (lastError instanceof Error) throw lastError;
  throw new Error(`Request to Gemini SDK failed after retries. (context=${contextLabel})`);
}

export async function analyzeDocumentWithLLM(
  text: string,
  userProviderTitle?: string,
  userCategory?: string,
  ocrMetrics?: OCRMetrics,
  onPipelineStep?: (step: number) => void
): Promise<LegalAnalysisReport> {
  const apiKey = getGeminiApiKeyOrThrow('analyzeDocumentWithLLM');

  const normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .trim();

  firePipelineStep(3, onPipelineStep);
  const fileConsistency = verifyFileConsistency(text, normalizedText, normalizedText);
  if (!fileConsistency.matches) {
    throw new Error(fileConsistency.mismatch_reason);
  }

  const resolvedProvider = (userProviderTitle && userProviderTitle.trim())
    ? userProviderTitle.trim()
    : (() => {
        const lines = normalizedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        return lines.length > 0 ? lines[0].slice(0, 60) : 'Document Provider';
      })();
  const resolvedCategory = (userCategory && userCategory.trim())
    ? userCategory.trim()
    : 'Legal Agreement';

  const prompt = `You are a fully dynamic AI Legal Intelligence Engine analyzing with zero templates, zero preset categories, zero hardcoded clause names, and zero cached outputs. You behave like ChatGPT: every output comes directly from the uploaded document below.

STRICTLY SEQUENTIAL 12-STEP INGESTION & PROCESSING PIPELINE — execute ALL 12 STEPS BEFORE output.

================================================================================
STEP 1 — Receive & Extract Text
  (You already receive the normalized document text below.)

STEP 2 — Normalize & Display Preview
  (You receive whitespace-normalized cleaned input.)

STEP 3 — File Consistency Check
  (Confirm internally the text triple is consistent; source document integrity check.)

STEP 4 — Document Classification & Input Validation — NON-NEGOTIABLE GUARDRAIL
Classify the document into EXACTLY ONE of these types (case-sensitive):
- Terms of Service
- Privacy Policy
- SaaS Agreement
- Employment Contract
- NDA
- Consumer Contract
- Rental Agreement
- Legal Notice
- Other Legal Agreement
- Not a Legal Agreement

Also compute metadata.classification_confidence number 0-100.

CLASSIFICATION GUARDRAIL (ABORT IF EITHER):
  A) classification is "Not a Legal Agreement" — IMMEDIATELY ABORT.
  B) classification_confidence < 85 — IMMEDIATELY ABORT.
If ABORT: output metadata.detected_type = "Not a Legal Agreement", metadata.overall_risk_rating = "Low", metadata.overall_risk = "Low", executive_overview.bottom_line = "${REJECTED_NON_LEGAL_NOTICE}", executive_overview.top_key_takeaways = [], overall_risk_rating = "Low", smart_action_steps = [], clauses = []

STEP 5 — Dynamic Document Segmentation
Dynamically break the normalized text into logical semantic sections based on ITS ACTUAL STRUCTURE ONLY. Do NOT use a fixed number or predefined section names. Analyze each logical section.

STEP 6 — Dynamic Clause Title Generation
For each semantic section GENERATE a UNIQUE clause_title that reflects THIS SPECIFIC DOCUMENT section. NEVER force into generic bins. Good title examples: "Alexa Voice Data Collection & Deletion", "Spotify Family Plan Geographic Eligibility Requirements". NEVER output "Data Clause".

STEP 7 — Plain-English Summarization Grade 7-8 Reading Level
Rewrite EACH clause in everyday simple English. Replace legalese phrases like:
  "sole discretion" → "the company alone decides"
  "binding arbitration" → "you cannot sue in a normal court and must use a private dispute resolver"
  "class action waiver" → "you cannot join a group lawsuit"
  "perpetual license" → "a permanent license that never ends"
Preserve ALL conditions, exceptions, deadlines, rights, and obligations. Put this result in interpretation.plain_english_summary.

STEP 8 — Real-World Impact Analysis
For EVERY clause fill two fields:
  interpretation.why_it_matters: practical real-world consequence why an ordinary user should care.
  interpretation.worst_case_impact: describe the practical worst-case realistic scenario (money, privacy, media loss, account bans, etc.) if the user ignores this clause.

STEP 9 — Actionable Recommendations
For EACH clause produce an interpretation.actionable_recommendation UNIQUE AND DERIVED EXCLUSIVELY from that clause. Not generic.
  GOOD: "Review voice privacy to opt out of recording storage"
  BAD: "Read this section carefully" (useless generic — DO NOT write this)

STEP 10 — Risk Rating
For EVERY clause:
  risk_rating ∈ "Low" | "Medium" | "High" | "Critical"
  interpretation.risk_justification: exactly one strict sentence explaining WHY that rating.
For the WHOLE DOCUMENT: overall_risk_rating ∈ "Low" | "Medium" | "High" | "Critical"
  overall_risk_rating = worst clause-level risk (Critical > High > Medium > Low).

STEP 11 — Traceability & Evidence Mapping
For EVERY clause populate original_evidence:
  original_evidence.exact_quote: EXACT VERBATIM contiguous substring from the NORMALIZED DOCUMENT TEXT block below. Must be copy-pasteable!
  original_evidence.char_start: character index where exact_quote BEGINS in the normalized text (0-based)
  original_evidence.char_end: character index where exact_quote ENDS (EXCLUSIVE, so normalizedText.slice(char_start, char_end) === exact_quote exactly)
  original_evidence.trigger_words: string[] of actual keywords/phrases from this clause that drove your risk analysis
DO NOT INVENT char_start/char_end — compute them by locating exact_quote inside the NORMALIZED DOCUMENT TEXT block.

STEP 12 — AI Semantic Validation Check
For EVERY clause the LLM self-validates YOUR summary AGAINST the SOURCE TEXT and writes semantic_validation:
  semantic_validation.semantic_match_percent: 0-100 (100 = summary perfectly matches original meaning)
  semantic_validation.legal_meaning_kept: true/false (true only if no legal nuance was lost)
  semantic_validation.misinterpretation_risk ∈ "Low" | "Medium" | "High"
  semantic_validation.hallucinated_content: short sentence listing any invented/fabricated facts, or the literal word "None" if the summary is 100% faithful and adds nothing
Additionally mirror into the legacy validation block (for UI compatibility):
  validation.semantic_match_score = semantic_match_percent
  validation.legal_meaning_preserved = legal_meaning_kept
  validation.missing_information: string or null (one sentence about any nuance you omitted; null if none)
  validation.added_information: string or null (one sentence about hallucinated content; null if none)
  validation.risk_of_misinterpretation = same as semantic_validation.misinterpretation_risk
  validation.validation_status ∈ "PASSED" | "FAILED"
    PASSED only if semantic_match_percent >= 85 AND legal_meaning_kept = true AND added_information is null AND hallucinated_content = "None". Otherwise FAILED.

After processing ALL clauses, build the EXECUTIVE OVERVIEW (write this LAST — you must know every clause first):
- executive_overview.bottom_line: 1–2 sentence DIRECT plain-English (Grade 7–8) summary of what this whole document means for the user. Someone reading ONLY this line should understand 100% of the critical risk posture.
- executive_overview.top_key_takeaways: array of EXACTLY 4 bullet points (strings). Each = the biggest risk/most impactful clause written at Grade 7–8 reading level with simple everyday words.

================================================================================
OUTPUT: STRICT JSON — NO EXTRA FIELDS. NO MARKDOWN CODE FENCES. NO COMMENTS.
Match this JSON schema EXACTLY:

{
  "metadata": {
    "detected_type": one of the 10 classification types,
    "classification_confidence": number 0-100,
    "overall_risk": "Low" | "Medium" | "High" | "Critical",
    "executive_overview": "one-paragraph string summary of the document scope (legacy field)",
    "total_clauses_analyzed": number (length of clauses array),
    "overall_risk_rating": "Low" | "Medium" | "High" | "Critical",
    "executive": {
      "bottom_line": "1-2 sentence plain-English summary of what this document means in everyday Grade 7-8 language.",
      "top_key_takeaways": [
        "Key Point 1: Clear, actionable risk written in Grade 7-8 English.",
        "Key Point 2: Clear, actionable risk written in Grade 7-8 English.",
        "Key Point 3: Clear, actionable risk written in Grade 7-8 English.",
        "Key Point 4: Clear, actionable risk written in Grade 7-8 English."
      ]
    }
  },
  "executive_overview": {
    "bottom_line": "1-2 sentence plain-English summary of what this document means in everyday language.",
    "top_key_takeaways": [
      "Key Point 1: Clear, actionable risk written in Grade 7-8 English.",
      "Key Point 2: Clear, actionable risk written in Grade 7-8 English.",
      "Key Point 3: Clear, actionable risk written in Grade 7-8 English.",
      "Key Point 4: Clear, actionable risk written in Grade 7-8 English."
    ]
  },
  "overall_risk_rating": "Low" | "Medium" | "High" | "Critical",
  "smart_action_steps": [
    {
      "action_title": "short action title",
      "reasoning": "why this action matters for this document"
    }
  ],
  "clauses": [
    {
      "clause_id": "short lowercase hex id like c8d102e3 (dynamically generated)",
      "clause_title": "unique specific title derived from actual clause (the dynamic title)",
      "risk_rating": "Low" | "Medium" | "High" | "Critical",
      "original_evidence": {
        "exact_quote": "Exact verbatim string extracted from the original NORMALIZED DOCUMENT TEXT below.",
        "char_start": number (0-based),
        "char_end": number (exclusive, so normalizedText.slice(char_start, char_end) === exact_quote),
        "trigger_words": ["royalty-free", "transferable", "sub-licensable"]
      },
      "interpretation": {
        "plain_english_summary": "1-2 sentences at Grade 7-8 reading level, no legalese.",
        "why_it_matters": "Practical reason why the user should care in everyday words.",
        "actionable_recommendation": "Direct step(s) the user can take right now.",
        "worst_case_impact": "Worst-case scenario regarding money, privacy, media, account or legal standing.",
        "risk_justification": "Short 1-sentence justification for the risk_rating."
      },
      "semantic_validation": {
        "semantic_match_percent": 0-100 number,
        "legal_meaning_kept": true or false,
        "misinterpretation_risk": "Low" | "Medium" | "High",
        "hallucinated_content": "sentence listing invented facts, or the literal word None"
      },
      "dynamic_title": "MUST EQUAL clause_title (legacy field)",
      "plain_english_summary": "MUST EQUAL interpretation.plain_english_summary (legacy field)",
      "why_it_matters": "MUST EQUAL interpretation.why_it_matters (legacy field)",
      "recommendation": "MUST EQUAL interpretation.actionable_recommendation (legacy field)",
      "potential_user_impact": "MUST EQUAL interpretation.worst_case_impact (legacy field)",
      "risk_level": "MUST EQUAL risk_rating (legacy field)",
      "risk_explanation": "MUST EQUAL interpretation.risk_justification (legacy field)",
      "evidence": {
        "original_legal_sentence": "MUST EQUAL original_evidence.exact_quote (legacy field)",
        "char_start": same number as original_evidence.char_start,
        "char_end": same number as original_evidence.char_end,
        "trigger_words": same array as original_evidence.trigger_words
      },
      "validation": {
        "semantic_match_score": same number as semantic_validation.semantic_match_percent,
        "legal_meaning_preserved": same boolean as semantic_validation.legal_meaning_kept,
        "missing_information": string or null,
        "added_information": string or null,
        "risk_of_misinterpretation": "Low" | "Medium" | "High",
        "validation_status": "PASSED" | "FAILED"
      }
    }
  ]
}

================================================================================
CONTEXT PROVIDER: ${resolvedProvider}
CONTEXT CATEGORY: ${resolvedCategory}

NORMALIZED DOCUMENT TEXT (USE THIS for exact_quote / char_start / char_end offsets):
"""${normalizedText}"""
`;

  firePipelineStep(4, onPipelineStep);

  try {
    const sdkResult = await generateContentWithSdkRetry(
      apiKey,
      prompt,
      {
        responseMimeType: "application/json",
        temperature: 0.2,
        topP: 0.95,
        maxOutputTokens: 65536,
      },
      'analyzeDocumentWithLLM'
    );

    firePipelineStep(5, onPipelineStep);
    firePipelineStep(6, onPipelineStep);

    const outputText = sdkResult?.response?.text();
    if (!outputText || typeof outputText !== 'string') {
      console.error('[Gemini SDK] analyzeDocumentWithLLM: empty or invalid text response from SDK.', {
        model: GEMINI_MODEL,
        sdkResultShallow: sdkResult ? { hasResponse: !!sdkResult.response } : null,
        keyMasked: maskedKey(apiKey),
      });
      throw new Error("Empty or invalid response from LLM API.");
    }

    let raw: RawReport;
    try {
      const cleaned = outputText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      raw = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('[Gemini SDK] analyzeDocumentWithLLM: LLM returned invalid JSON.', {
        model: GEMINI_MODEL,
        parseErrorMessage: parseErr instanceof Error ? parseErr.message : String(parseErr),
        outputTextLength: outputText.length,
        outputTextFirst200: outputText.slice(0, 200),
        outputTextLast200: outputText.slice(-200),
        keyMasked: maskedKey(apiKey),
      });
      throw new Error("LLM returned invalid JSON response. Please retry.");
    }

    firePipelineStep(7, onPipelineStep);
    firePipelineStep(8, onPipelineStep);
    firePipelineStep(9, onPipelineStep);

    const rawMeta = raw.metadata || {};

    const detected_type = validateDetectedType(rawMeta.detected_type);
    const classification_confidence = typeof rawMeta.classification_confidence === 'number'
      ? rawMeta.classification_confidence
      : 0;

    if (detected_type === 'Not a Legal Agreement' || classification_confidence < 85) {
      return {
        metadata: {
          detected_type: 'Not a Legal Agreement',
          classification_confidence,
          overall_risk: 'Low',
          executive_overview: REJECTED_NON_LEGAL_NOTICE,
          total_clauses_analyzed: 0,
          executive: {
            bottom_line: REJECTED_NON_LEGAL_NOTICE,
            top_key_takeaways: []
          },
          overall_risk_rating: 'Low'
        },
        smart_action_steps: [],
        clauses: []
      };
    }

    const rawClauses = Array.isArray(raw.clauses) ? raw.clauses : [];

    async function processClauseRecord(rc: RawDynamicClause, idx: number): Promise<DynamicClause> {
      const rawOrigEv = rc.original_evidence || {};
      const rawInterp = rc.interpretation || {};
      const rawSemVal = rc.semantic_validation || {};
      const rawEvidence = rc.evidence || {};
      const rawVal = rc.validation || {};

      const preferredExactQuote = (typeof rawOrigEv.exact_quote === 'string' && rawOrigEv.exact_quote.length > 0)
        ? rawOrigEv.exact_quote
        : (typeof rawEvidence.original_legal_sentence === 'string'
          ? rawEvidence.original_legal_sentence
          : '');
      const sentence = preferredExactQuote;

      const preferredCharStart = typeof rawOrigEv.char_start === 'number'
        ? rawOrigEv.char_start
        : (typeof rawEvidence.char_start === 'number' ? rawEvidence.char_start : -1);
      let cStart = preferredCharStart;
      if ((cStart < 0 || normalizedText.slice(cStart, cStart + Math.min(40, sentence.length)) !== sentence.slice(0, Math.min(40, sentence.length))) && sentence.length > 0) {
        cStart = normalizedText.indexOf(sentence);
      }
      if (cStart < 0 && sentence.length > 0) cStart = normalizedText.indexOf(sentence.slice(0, Math.min(40, sentence.length)));
      if (cStart < 0) cStart = 0;

      const preferredCharEnd = typeof rawOrigEv.char_end === 'number'
        ? rawOrigEv.char_end
        : (typeof rawEvidence.char_end === 'number' ? rawEvidence.char_end : cStart + sentence.length);
      let cEnd = preferredCharEnd;
      if (typeof cEnd !== 'number' || cEnd < cStart) cEnd = cStart + sentence.length;

      const preferredTriggers = Array.isArray(rawOrigEv.trigger_words) && rawOrigEv.trigger_words.length > 0
        ? rawOrigEv.trigger_words
        : (Array.isArray(rawEvidence.trigger_words) ? rawEvidence.trigger_words : []);

      const evidence: ClauseEvidence = {
        original_legal_sentence: sentence,
        char_start: cStart,
        char_end: cEnd,
        trigger_words: preferredTriggers.filter(Boolean)
      };

      const original_evidence: OriginalEvidence = {
        exact_quote: sentence,
        char_start: cStart,
        char_end: cEnd,
        trigger_words: evidence.trigger_words.slice()
      };

      const missingInfo = Array.isArray(rawVal.missing_information)
        ? (rawVal.missing_information.filter(Boolean).join('; ') || null)
        : (typeof rawVal.missing_information === 'string' && rawVal.missing_information.length > 0 && rawVal.missing_information !== 'None' && rawVal.missing_information !== 'none' && rawVal.missing_information !== 'null'
          ? rawVal.missing_information
          : null);
      const addedInfo = Array.isArray(rawVal.added_information)
        ? (rawVal.added_information.filter(Boolean).join('; ') || null)
        : (typeof rawVal.added_information === 'string' && rawVal.added_information.length > 0 && rawVal.added_information !== 'None' && rawVal.added_information !== 'none' && rawVal.added_information !== 'null'
          ? rawVal.added_information
          : null);

      const semanticScore = typeof rawVal.semantic_match_score === 'number'
        ? rawVal.semantic_match_score
        : (typeof rawSemVal.semantic_match_percent === 'number' ? rawSemVal.semantic_match_percent : 0);
      const meaningPreserved = rawVal.legal_meaning_preserved === true || rawSemVal.legal_meaning_kept === true;
      const statusPassed = semanticScore >= 85 && meaningPreserved && !addedInfo && (!rawSemVal.hallucinated_content || rawSemVal.hallucinated_content === 'None' || rawSemVal.hallucinated_content === 'none');

      const validation: ValidationReport = {
        semantic_match_score: Math.max(0, Math.min(100, semanticScore)),
        legal_meaning_preserved: meaningPreserved,
        missing_information: missingInfo,
        added_information: addedInfo,
        risk_of_misinterpretation: validateMisinterpretationRisk(typeof rawVal.risk_of_misinterpretation === 'string' && rawVal.risk_of_misinterpretation.length > 0
          ? rawVal.risk_of_misinterpretation
          : rawSemVal.misinterpretation_risk),
        validation_status: statusPassed ? 'PASSED' : 'FAILED'
      };

      const semantic_validation: SemanticValidationPanel = {
        semantic_match_percent: validation.semantic_match_score,
        legal_meaning_kept: validation.legal_meaning_preserved,
        misinterpretation_risk: validation.risk_of_misinterpretation,
        hallucinated_content: (typeof rawSemVal.hallucinated_content === 'string' && rawSemVal.hallucinated_content.trim().length > 0)
          ? rawSemVal.hallucinated_content.trim()
          : (validation.added_information && validation.added_information.length > 0
            ? validation.added_information
            : 'None')
      };

      const preferredRisk = rc.risk_rating || rc.risk_level;
      const risk_level = validateClauseRiskLevel(preferredRisk);

      const preferredTitle = (typeof rc.clause_title === 'string' && rc.clause_title.trim().length > 0)
        ? rc.clause_title.trim()
        : (typeof rc.dynamic_title === 'string' && rc.dynamic_title.trim().length > 0
          ? rc.dynamic_title.trim()
          : `Document Provision ${idx + 1}`);

      const interpretationPlainSummary = typeof rawInterp.plain_english_summary === 'string' && rawInterp.plain_english_summary.length > 0
        ? rawInterp.plain_english_summary
        : (typeof rc.plain_english_summary === 'string' ? rc.plain_english_summary : '');
      const interpretationWhy = typeof rawInterp.why_it_matters === 'string' && rawInterp.why_it_matters.length > 0
        ? rawInterp.why_it_matters
        : (typeof rc.why_it_matters === 'string' ? rc.why_it_matters : '');
      const interpretationRec = typeof rawInterp.actionable_recommendation === 'string' && rawInterp.actionable_recommendation.length > 0
        ? rawInterp.actionable_recommendation
        : (typeof rc.recommendation === 'string' ? rc.recommendation : '');
      const interpretationWorst = typeof rawInterp.worst_case_impact === 'string' && rawInterp.worst_case_impact.length > 0
        ? rawInterp.worst_case_impact
        : (typeof rc.potential_user_impact === 'string' ? rc.potential_user_impact : '');
      const interpretationJustification = typeof rawInterp.risk_justification === 'string' && rawInterp.risk_justification.length > 0
        ? rawInterp.risk_justification
        : (typeof rc.risk_explanation === 'string' && rc.risk_explanation.length > 0
          ? rc.risk_explanation
          : `Rated ${risk_level} risk based on clause analysis.`);

      const interpretation: ClauseInterpretation = {
        plain_english_summary: interpretationPlainSummary,
        why_it_matters: interpretationWhy,
        actionable_recommendation: interpretationRec,
        worst_case_impact: interpretationWorst,
        risk_justification: interpretationJustification
      };

      return {
        clause_id: typeof rc.clause_id === 'string' && rc.clause_id.length > 0
          ? rc.clause_id
          : generateUUID(),
        dynamic_title: preferredTitle,
        plain_english_summary: interpretationPlainSummary,
        why_it_matters: interpretationWhy,
        recommendation: interpretationRec,
        potential_user_impact: interpretationWorst,
        risk_level,
        risk_explanation: interpretationJustification,
        evidence,
        validation,
        clause_title: preferredTitle,
        risk_rating: risk_level,
        original_evidence,
        interpretation,
        semantic_validation
      };
    }

    const clauses: DynamicClause[] = [];
    const batchSize = Math.max(1, Math.min(8, typeof CLAUSE_BATCH_CONCURRENCY === 'number' ? CLAUSE_BATCH_CONCURRENCY : 3));
    for (let i = 0; i < rawClauses.length; i += batchSize) {
      const chunk = rawClauses.slice(i, i + batchSize);
      const processedChunk = await Promise.all(
        chunk.map((rc, chunkIdx) => processClauseRecord(rc, i + chunkIdx))
      );
      clauses.push(...processedChunk);
    }

    firePipelineStep(10, onPipelineStep);
    firePipelineStep(11, onPipelineStep);

    const rawSteps = Array.isArray(raw.smart_action_steps) ? raw.smart_action_steps : [];
    const smart_action_steps: SmartActionStep[] = rawSteps
      .filter(s => typeof s.action_title === 'string' && s.action_title.trim().length > 0)
      .map(s => ({
        action_title: s.action_title!.trim(),
        reasoning: typeof s.reasoning === 'string' ? s.reasoning : ''
      }));

    const hasCritical = clauses.some(c => c.risk_level === 'Critical');
    const hasHigh = clauses.some(c => c.risk_level === 'High');
    const hasMedium = clauses.some(c => c.risk_level === 'Medium');
    const computedOverall: RiskLevel = hasCritical
      ? 'Critical'
      : hasHigh
      ? 'High'
      : hasMedium
      ? 'Medium'
      : 'Low';
    const rawOverallRating = raw.overall_risk_rating || rawMeta.overall_risk_rating || rawMeta.overall_risk;
    const overall_risk = validateClauseRiskLevel(rawOverallRating) ?? computedOverall;

    const rawRootExecutive = raw.executive_overview;
    const rawMetaExecutive = rawMeta?.executive;
    const preferredBottomLine = typeof rawRootExecutive?.bottom_line === 'string' && rawRootExecutive.bottom_line.trim().length > 0
      ? rawRootExecutive.bottom_line.trim()
      : (typeof rawMetaExecutive?.bottom_line === 'string' && rawMetaExecutive.bottom_line.trim().length > 0
        ? rawMetaExecutive.bottom_line.trim()
        : '');
    const preferredTakeaways = Array.isArray(rawRootExecutive?.top_key_takeaways) && rawRootExecutive.top_key_takeaways.length > 0
      ? rawRootExecutive.top_key_takeaways.filter(s => typeof s === 'string' && s.trim().length > 0)
      : (Array.isArray(rawMetaExecutive?.top_key_takeaways)
        ? rawMetaExecutive.top_key_takeaways.filter(s => typeof s === 'string' && s.trim().length > 0)
        : []);

    const executive: ExecutiveOverview = {
      bottom_line: preferredBottomLine.length > 0
        ? preferredBottomLine
        : (typeof rawMeta.executive_overview === 'string' && rawMeta.executive_overview.length > 0
          ? rawMeta.executive_overview
          : `This ${detected_type} analysis covers ${clauses.length} dynamically discovered sections. Overall risk assessment: ${overall_risk}.`),
      top_key_takeaways: preferredTakeaways.slice(0, 4)
    };

    const legacyExecutiveOverviewString = executive.bottom_line + (executive.top_key_takeaways.length > 0
      ? ' — Key points: ' + executive.top_key_takeaways.join(' | ')
      : '');

    const report: LegalAnalysisReport = {
      metadata: {
        detected_type,
        classification_confidence,
        overall_risk,
        executive_overview: typeof rawMeta.executive_overview === 'string' && rawMeta.executive_overview.length > 0
          ? rawMeta.executive_overview
          : legacyExecutiveOverviewString,
        total_clauses_analyzed: typeof rawMeta.total_clauses_analyzed === 'number'
          ? rawMeta.total_clauses_analyzed
          : clauses.length,
        executive,
        overall_risk_rating: overall_risk
      },
      smart_action_steps,
      clauses
    };

    firePipelineStep(12, onPipelineStep);
    void ocrMetrics; // Reserved for future audit logging

    return report;
  } catch (err) {
    const urlHint = `(SDK-managed: models/${GEMINI_MODEL}:generateContent via @google/generative-ai)`;
    console.error('[Gemini SDK] analyzeDocumentWithLLM: FATAL pipeline error.', {
      model: GEMINI_MODEL,
      endpointUrlHint: urlHint,
      documentWordCount: text.trim().split(/\s+/).filter(Boolean).length,
      providerTitle: userProviderTitle || '(none)',
      domainCategory: userCategory || '(none)',
      keyMasked: maskedKey(apiKey),
      errorObject: err,
      errorMessage: err instanceof Error ? err.message : String(err),
      errorStack: err instanceof Error ? err.stack : undefined,
    });
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`LLM analysis failed: ${String(err)}`);
  }
}
