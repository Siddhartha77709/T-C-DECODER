import type { AnalysisResult, AnalyzedClause, QuickMatrix, ActionableSuggestion, RiskLevelLabel } from './types';

const MANDATORY_DISCLAIMER = "T&C Decoder provides automated AI-generated summaries for informational purposes only. This report does not constitute professional legal advice. Please consult a qualified legal professional for specific concerns.";

// Extract company name intelligently
function extractCompanyName(text: string, userProvidedTitle?: string): string {
  if (userProvidedTitle && userProvidedTitle.trim().length > 0) {
    return userProvidedTitle.trim();
  }

  const knownProviders: { pattern: RegExp; name: string }[] = [
    { pattern: /\bgoogle\b/i, name: 'Google' },
    { pattern: /\bmeta\b|\bfacebook\b/i, name: 'Meta' },
    { pattern: /\bamazon\b|\baws\b/i, name: 'Amazon' },
    { pattern: /\bapple\b/i, name: 'Apple' },
    { pattern: /\bmicrosoft\b/i, name: 'Microsoft' },
    { pattern: /\bnetflix\b/i, name: 'Netflix' },
    { pattern: /\bspotify\b/i, name: 'Spotify' },
    { pattern: /\btiktok\b/i, name: 'TikTok' },
    { pattern: /\btwitter\b|\bx\.com\b/i, name: 'X (Twitter)' },
    { pattern: /\blinkedin\b/i, name: 'LinkedIn' },
    { pattern: /\bslack\b/i, name: 'Slack' },
    { pattern: /\bzoom\b/i, name: 'Zoom' },
    { pattern: /\bdropbox\b/i, name: 'Dropbox' },
    { pattern: /\bairbnb\b/i, name: 'Airbnb' },
    { pattern: /\buber\b/i, name: 'Uber' },
    { pattern: /\bpaypal\b/i, name: 'PayPal' },
    { pattern: /\bshopify\b/i, name: 'Shopify' },
    { pattern: /\badobe\b/i, name: 'Adobe' },
    { pattern: /\bsalesforce\b/i, name: 'Salesforce' },
    { pattern: /\bgithub\b/i, name: 'GitHub' },
  ];

  for (const provider of knownProviders) {
    if (provider.pattern.test(text)) {
      return provider.name;
    }
  }

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length > 0) {
    const cleanLine = lines[0]
      .replace(/(terms of service|terms of use|privacy policy|agreement|terms and conditions|terms|T&C|LLC|Inc\.|Ltd\.)/gi, '')
      .trim();
    if (cleanLine.length > 2 && cleanLine.length < 50) {
      return cleanLine;
    }
  }

  return "Unknown Service";
}

// Extensive legal clause rule definitions with full body sentence extraction (NO HEADERS)
interface ClauseRule {
  title: string;
  risk_level: RiskLevelLabel;
  keywords: RegExp[];
  triggers: string[];
  summary: string;
  rationale: string;
  impact: string;
  recommendation: string;
  recommendationRationale: string;
}

const CLAUSE_PATTERNS: ClauseRule[] = [
  {
    title: "Arbitration & Class Action Waiver",
    risk_level: 'High Risk',
    keywords: [/class\s+action/i, /waive.*class/i, /binding\s+arbitration/i, /arbitrate/i, /individual\s+arbitration/i],
    triggers: ["binding arbitration", "class action waiver", "individual capacity"],
    summary: "Disputes must be resolved individually through private binding arbitration rather than class action lawsuits in public court.",
    rationale: "The contract language waives constitutional court access and mandates private arbitration for all claims.",
    impact: "You cannot join with other affected users in a group lawsuit if a data breach or system failure occurs.",
    recommendation: "Check the agreement for a 30-day written arbitration opt-out address.",
    recommendationRationale: "Submitting a timely opt-out letter preserves your right to court proceedings if disputes arise."
  },
  {
    title: "AI Model Training & Telemetry License",
    risk_level: 'High Risk',
    keywords: [/train.*ai/i, /machine\s+learning/i, /telemetry/i, /monetize.*data/i, /perpetual.*license/i, /royalty.?free.*license/i],
    triggers: ["machine learning", "AI training", "perpetual license", "telemetry"],
    summary: "The provider collects session logs and uploaded content to train commercial machine learning and artificial intelligence models.",
    rationale: "The agreement grants a worldwide, perpetual license to process user telemetry and uploaded content for AI model development.",
    impact: "Your usage patterns and interactions may permanently inform AI features without financial compensation.",
    recommendation: "Review privacy settings after account creation to disable optional telemetry sharing.",
    recommendationRationale: "Data sharing toggles are active by default and require manual opt-out."
  },
  {
    title: "Unilateral Account Termination",
    risk_level: 'High Risk',
    keywords: [/terminat.*without.*notice/i, /suspend.*sole.*discretion/i, /terminat.*at.*any\s+time/i, /close\s+your\s+account/i],
    triggers: ["terminate at any time", "sole discretion", "without notice"],
    summary: "The company reserves the right to suspend or terminate account access at any time at its sole discretion.",
    rationale: "The clause grants the provider absolute permission to revoke account access without advance written warning.",
    impact: "You could abruptly lose access to stored documents, purchase history, and account features.",
    recommendation: "Maintain independent local backups of critical files stored on the platform.",
    recommendationRationale: "Immediate account suspension cuts off access to platform-stored files."
  },
  {
    title: "Strict Billing Renewal & Cancellation Window",
    risk_level: 'Needs Attention',
    keywords: [/automatic.*renew/i, /auto.?renew/i, /renew\s+automatically/i, /recurring\s+billing/i, /30\s+days/i],
    triggers: ["automatically renew", "recurring billing", "advance notice"],
    summary: "Subscriptions auto-renew each billing period unless canceled within the required advance notice window.",
    rationale: "The text specifies recurring billing and sets a fixed advance deadline to stop subsequent cycle charges.",
    impact: "Your payment method will be charged automatically if cancellation is requested past the deadline.",
    recommendation: "Set a calendar reminder 7 days before your subscription renewal date.",
    recommendationRationale: "Advance reminders ensure adequate time to cancel before recurring charges process."
  },
  {
    title: "Limitation of Financial Liability",
    risk_level: 'Needs Attention',
    keywords: [/limitation\s+of\s+liability/i, /shall\s+not\s+exceed/i, /maximum.*liability/i, /fifty\s+dollars/i, /\$50/i],
    triggers: ["shall not exceed", "maximum liability", "as is"],
    summary: "The company caps its total monetary liability for service disruptions or damages to a small fixed amount.",
    rationale: "The terms establish a strict legal ceiling on financial damages recoverable by users.",
    impact: "If service outages cause business losses, legal recovery is limited to the capped amount.",
    recommendation: "Avoid relying exclusively on the service for unbacked business-critical operations.",
    recommendationRationale: "Financial damages caps protect the provider against major loss claims."
  },
  {
    title: "Retention of Content Ownership",
    risk_level: 'Low Risk',
    keywords: [/you\s+own.*content/i, /retain.*ownership/i, /you\s+retain\s+all\s+rights/i],
    triggers: ["retain ownership", "you own your content"],
    summary: "You retain full copyright and intellectual property rights over all original materials uploaded to the service.",
    rationale: "The text explicitly confirms user ownership of uploaded content.",
    impact: "Your original creative or proprietary assets remain your legal property.",
    recommendation: "Maintain standard credential security when uploading original work.",
    recommendationRationale: "Your intellectual property rights are protected under this provision."
  }
];

// Clean text to extract pure legal body sentence (STRICT NO HEADERS RULE)
function cleanBodySentence(rawSentence: string): string {
  let cleaned = rawSentence.trim();
  // Strip uppercase section headers at start of sentence, e.g. "1. LICENSE AND RESTRICTIONS. Zoom hereby..." -> "Zoom hereby..."
  cleaned = cleaned.replace(/^[0-9A-Z\s.#\-_:]*(?:TERMS|LICENSE|RENEWAL|ARBITRATION|LIMITATION|DISCLAIMER|MEMBERSHIP|BILLING|PRIVACY|DATA|NOTICE|RIGHTS|WARRANTIES|TERMINATION|SERVICES|RESTRICTIONS)[A-Z0-9\s.#\-_:]*\.\s*/i, '');
  cleaned = cleaned.replace(/^[0-9A-Z]{2,}(?:\s+[0-9A-Z]{2,})*\.\s*/, '');
  return cleaned || rawSentence;
}

// Contextual clause extraction logic for local fallback
function extractClausesFromText(text: string): AnalyzedClause[] {
  const analyzed_clauses: AnalyzedClause[] = [];
  const matchedTitles = new Set<string>();
  let clauseIdCounter = 1;

  const paragraphs = text
    .split(/(?:\n\s*\n|\n(?=[0-9A-Z]\.|\bSection\b|\bArticle\b))/i)
    .map(p => p.trim())
    .filter(p => p.length > 15);

  const sentences = text
    .split(/[.!?\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  for (const para of paragraphs) {
    for (const rule of CLAUSE_PATTERNS) {
      if (matchedTitles.has(rule.title)) continue;
      if (rule.keywords.some(regex => regex.test(para))) {
        matchedTitles.add(rule.title);

        const rawSentence = sentences.find(s =>
          rule.keywords.some(regex => regex.test(s))
        ) || para;

        const bodySentence = cleanBodySentence(rawSentence);

        const matchedTriggers = rule.triggers.filter(t => new RegExp(t, 'i').test(bodySentence));
        if (matchedTriggers.length === 0) matchedTriggers.push(rule.triggers[0] || rule.title);

        analyzed_clauses.push({
          clause_id: clauseIdCounter++,
          clause_title: rule.title,
          risk_level: rule.risk_level,
          overall_clause_assessment: rule.risk_level,
          exact_original_wording: bodySentence.trim(),
          exact_verbatim_quote: bodySentence.trim(),
          trigger_words: matchedTriggers,
          highlighted_evidence: matchedTriggers.join(', '),
          plain_english_summary: rule.summary,
          plain_english_translation: rule.summary,
          interpretation_rationale: rule.rationale,
          why_ai_summarized: rule.rationale,
          recommendation: rule.recommendation,
          recommendation_rationale: rule.recommendationRationale,
          why_recommended: rule.recommendationRationale,
          user_impact: rule.impact,
          potential_user_impact: rule.impact
        });
      }
    }
  }

  // Fallback for general contracts
  if (analyzed_clauses.length === 0 && paragraphs.length > 0) {
    for (let i = 0; i < Math.min(paragraphs.length, 5); i++) {
      const p = paragraphs[i];
      if (p.length < 20) continue;

      let title = "General Terms & Provisions";
      let risk: RiskLevelLabel = 'Needs Attention';

      const firstLine = p.split('\n')[0].replace(/^[0-9#.*-\s]+/, '').trim();
      if (firstLine.length > 3 && firstLine.length < 60) {
        title = firstLine;
      } else {
        title = `Section ${i + 1} Terms`;
      }

      if (/terminate|cancel|liability|indemnify|disclaim/i.test(p)) {
        risk = 'Be Careful';
      } else if (/license|rights|modify|update|privacy/i.test(p)) {
        risk = 'Needs Attention';
      } else {
        risk = 'Low Risk';
      }

      const rawSentence = p.split('.')[0] + '.' || p;
      const bodySentence = cleanBodySentence(rawSentence);

      analyzed_clauses.push({
        clause_id: clauseIdCounter++,
        clause_title: title,
        risk_level: risk,
        overall_clause_assessment: risk,
        exact_original_wording: bodySentence.trim(),
        exact_verbatim_quote: bodySentence.trim(),
        trigger_words: [title],
        highlighted_evidence: title,
        plain_english_summary: `Establishes standard terms regarding ${title.toLowerCase()}.`,
        plain_english_translation: `Establishes standard terms regarding ${title.toLowerCase()}.`,
        interpretation_rationale: `Derived from Section ${i + 1} defining user obligations and operational guidelines.`,
        why_ai_summarized: `Derived from Section ${i + 1} defining user obligations and operational guidelines.`,
        recommendation: "Review this section to ensure compliance with operational guidelines.",
        recommendation_rationale: "Understanding contractual terms prevents unexpected policy issues.",
        why_recommended: "Understanding contractual terms prevents unexpected policy issues.",
        user_impact: "Defines standard operational requirements and boundaries for service usage.",
        potential_user_impact: "Defines standard operational requirements and boundaries for service usage."
      });
    }
  }

  return analyzed_clauses;
}

// Local fallback evaluation engine
export function analyzeDocumentLocally(
  text: string,
  userProviderTitle?: string,
  userCategory?: string
): AnalysisResult {
  const provider_title = extractCompanyName(text, userProviderTitle);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const word_count = words.length;
  const estimated_read_time_minutes = Math.max(1, Math.ceil(word_count / 220));

  const analyzed_clauses = extractClausesFromText(text);

  const sells_or_monetizes_data = text.search(/sell.*data|monetize.*data|share.*advertiser|train.*ai|telemetry/i) !== -1;
  const mandatory_arbitration = text.search(/binding\s+arbitration|arbitrate|exclusive.*arbitration|individual\s+arbitration/i) !== -1;
  const waives_class_action = text.search(/class\s+action|waive.*class|waiver.*class/i) !== -1;
  const auto_renewal_charges = text.search(/automatic.*renew|auto.?renew|renew\s+automatically|recurring\s+billing/i) !== -1;
  const easy_account_deletion = text.search(/delete.*account|erasure.*request|right.*delete.*data|delete\s+your\s+account/i) !== -1;

  const quick_matrix: QuickMatrix = {
    sells_or_monetizes_data,
    mandatory_arbitration,
    waives_class_action,
    auto_renewal_charges,
    easy_account_deletion
  };

  const highRiskCount = analyzed_clauses.filter(c => c.risk_level === 'High Risk' || c.risk_level === 'RED').length;
  const beCarefulCount = analyzed_clauses.filter(c => c.risk_level === 'Be Careful').length;

  let overall_rating: RiskLevelLabel = 'Low Risk';
  if (highRiskCount >= 2 || (mandatory_arbitration && sells_or_monetizes_data)) {
    overall_rating = 'High Risk';
  } else if (highRiskCount >= 1 || beCarefulCount >= 1) {
    overall_rating = 'Be Careful';
  } else if (auto_renewal_charges) {
    overall_rating = 'Needs Attention';
  } else {
    overall_rating = 'Low Risk';
  }

  const domain_category = (userCategory && userCategory.trim().length > 0)
    ? userCategory.trim()
    : "Software & SaaS";

  const topTitles = analyzed_clauses.map(c => c.clause_title);
  const document_summary = `This agreement for ${provider_title} contains key legal terms governing user rights. Core clauses identified include: ${topTitles.slice(0, 3).join(', ')}.`;

  const actionable_suggestions: ActionableSuggestion[] = analyzed_clauses
    .filter(c => c.recommendation)
    .map(c => ({
      suggestion: c.recommendation,
      reason: c.recommendation_rationale || c.interpretation_rationale
    }));

  return {
    provider_title,
    domain_category,
    overall_rating,
    risk_rating_label: overall_rating,
    estimated_read_time_minutes,
    word_count,
    quick_matrix,
    executive_summary: document_summary,
    document_summary,
    analyzed_clauses,
    clauses: analyzed_clauses,
    actionable_suggestions,
    legal_disclaimer: MANDATORY_DISCLAIMER,
    raw_document_text: text,

    companyName: provider_title,
    verdict: overall_rating,
    estimatedReadTime: `${estimated_read_time_minutes} min read (${word_count} words)`,
    quickNote: document_summary,
    suggestions: actionable_suggestions
  };
}

// Deep Legal AI Analysis Engine powered by Gemini LLM (PART 1 Prompt Logic with NO HEADERS Rule)
export async function analyzeDocumentWithGemini(
  text: string,
  apiKey: string,
  userProviderTitle?: string,
  userCategory?: string
): Promise<AnalysisResult> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const resolvedProvider = (userProviderTitle && userProviderTitle.trim())
    ? userProviderTitle.trim()
    : extractCompanyName(text);

  const resolvedCategory = (userCategory && userCategory.trim())
    ? userCategory.trim()
    : "Software & SaaS";

  const prompt = `You are an expert legal AI assistant specializing in contract breakdown, risk detection, and precise clause traceability.

Your task is to analyze the provided legal document and break it down into clause-by-clause evaluations using exact line extraction and clear, accurate plain-English translations.

CRITICAL EXTRACTION & ANALYSIS RULES:

1. FULL CLAUSE TRACEABILITY (STRICT):
   - For the 'exact_original_wording' field, you MUST extract the full, contiguous legal sentence or paragraph from the body text of the contract.
   - NEVER extract section headers, titles, or uppercase standalone headers alone (e.g., DO NOT extract 'AUTOMATIC SUBSCRIPTION RENEWAL', 'TELEMETRY AND USER DATA LICENSE', or 'MANDATORY ARBITRATION AND CLASS ACTION WAIVER').
   - ALWAYS extract the full legal body sentence (e.g., 'All paid subscriptions to the Services shall automatically renew at the end of each billing period at the then-current subscription rate.').

2. ACCURATE TRIGGER IDENTIFICATION:
   - Identify the exact key terms or short phrases within that extracted sentence that triggered the rule or risk level (e.g., 'perpetual', 'no refunds', 'binding arbitration').

3. BALANCED & ACCURATE PLAIN-ENGLISH SUMMARY:
   - Write a clear, 1-2 sentence plain-language summary explaining what the clause means for an average user.
   - DO NOT OVERSTATE OR EXAGGERATE: Maintain precise legal accuracy. If a restriction applies only under specific conditions, state that exact limitation rather than making absolute statements like 'under any circumstances'.

4. ACTIONABLE RECOMMENDATIONS:
   - Provide practical, concrete steps the user can take (e.g., setting reminders, reviewing account privacy toggles, or opting out).

5. STRUCTURED OUTPUT FORMAT:
   Return the response exclusively in JSON matching this exact structure:
   {
     "document_summary": "Overall plain English overview...",
     "clauses": [
       {
         "clause_title": "Descriptive Title",
         "risk_level": "High Risk | Be Careful | Needs Attention | Low Risk",
         "exact_original_wording": "Full contiguous body sentence extracted directly from source text (NO HEADERS)",
         "trigger_words": ["keyword1", "keyword2"],
         "plain_english_summary": "Accurate, balanced summary",
         "interpretation_rationale": "Why the AI interpreted it this way",
         "recommendation": "Actionable user step",
         "recommendation_rationale": "Why this action is recommended",
         "user_impact": "Direct potential consequence for the user"
       }
     ]
   }

DOCUMENT CONTEXT:
Provider: ${resolvedProvider}
Category: ${resolvedCategory}

Original Agreement Text:
"""
${text}
"""`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              document_summary: { type: "STRING" },
              clauses: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    clause_title: { type: "STRING" },
                    risk_level: {
                      type: "STRING",
                      enum: ["High Risk", "Be Careful", "Needs Attention", "Low Risk"]
                    },
                    exact_original_wording: { type: "STRING" },
                    trigger_words: {
                      type: "ARRAY",
                      items: { type: "STRING" }
                    },
                    plain_english_summary: { type: "STRING" },
                    interpretation_rationale: { type: "STRING" },
                    recommendation: { type: "STRING" },
                    recommendation_rationale: { type: "STRING" },
                    user_impact: { type: "STRING" }
                  },
                  required: [
                    "clause_title", "risk_level", "exact_original_wording", "trigger_words",
                    "plain_english_summary", "interpretation_rationale", "recommendation",
                    "recommendation_rationale", "user_impact"
                  ]
                }
              }
            },
            required: ["document_summary", "clauses"]
          }
        }
      })
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!outputText) throw new Error("Empty response from Gemini API");

    const json = JSON.parse(outputText);

    const rawClauses = json.clauses || [];
    const mappedClauses: AnalyzedClause[] = rawClauses.map((c: any, idx: number) => ({
      clause_id: idx + 1,
      clause_title: c.clause_title,
      risk_level: c.risk_level,
      overall_clause_assessment: c.risk_level,
      exact_original_wording: c.exact_original_wording,
      exact_verbatim_quote: c.exact_original_wording,
      trigger_words: c.trigger_words || [],
      highlighted_evidence: (c.trigger_words && c.trigger_words.length > 0) ? c.trigger_words.join(', ') : '',
      plain_english_summary: c.plain_english_summary,
      plain_english_translation: c.plain_english_summary,
      interpretation_rationale: c.interpretation_rationale,
      why_ai_summarized: c.interpretation_rationale,
      recommendation: c.recommendation,
      recommendation_rationale: c.recommendation_rationale,
      why_recommended: c.recommendation_rationale,
      user_impact: c.user_impact,
      potential_user_impact: c.user_impact
    }));

    const actionable_suggestions: ActionableSuggestion[] = mappedClauses
      .filter(c => c.recommendation && c.recommendation.trim().length > 0)
      .map(c => ({
        suggestion: c.recommendation,
        reason: c.recommendation_rationale || c.interpretation_rationale
      }));

    let overall_rating: RiskLevelLabel = 'Low Risk';
    if (mappedClauses.some(c => c.risk_level === 'High Risk')) {
      overall_rating = 'High Risk';
    } else if (mappedClauses.some(c => c.risk_level === 'Be Careful')) {
      overall_rating = 'Be Careful';
    } else if (mappedClauses.some(c => c.risk_level === 'Needs Attention')) {
      overall_rating = 'Needs Attention';
    }

    const words = text.split(/\s+/).filter(w => w.length > 0);
    const word_count = words.length;
    const estimated_read_time_minutes = Math.max(1, Math.ceil(word_count / 220));

    const sells_or_monetizes_data = text.search(/sell.*data|monetize.*data|share.*advertiser|train.*ai|telemetry/i) !== -1;
    const mandatory_arbitration = text.search(/binding\s+arbitration|arbitrate|exclusive.*arbitration|individual\s+arbitration/i) !== -1;
    const waives_class_action = text.search(/class\s+action|waive.*class|waiver.*class/i) !== -1;
    const auto_renewal_charges = text.search(/automatic.*renew|auto.?renew|renew\s+automatically|recurring\s+billing/i) !== -1;
    const easy_account_deletion = text.search(/delete.*account|erasure.*request|right.*delete.*data|delete\s+your\s+account/i) !== -1;

    const quick_matrix: QuickMatrix = {
      sells_or_monetizes_data,
      mandatory_arbitration,
      waives_class_action,
      auto_renewal_charges,
      easy_account_deletion
    };

    return {
      provider_title: resolvedProvider,
      domain_category: resolvedCategory,
      overall_rating,
      risk_rating_label: overall_rating,
      estimated_read_time_minutes,
      word_count,
      quick_matrix,
      executive_summary: json.document_summary || "Plain English document overview.",
      document_summary: json.document_summary || "Plain English document overview.",
      analyzed_clauses: mappedClauses,
      clauses: mappedClauses,
      actionable_suggestions,
      legal_disclaimer: MANDATORY_DISCLAIMER,
      raw_document_text: text,
      companyName: resolvedProvider,
      verdict: overall_rating,
      estimatedReadTime: `${estimated_read_time_minutes} min read (${word_count} words)`,
      quickNote: json.document_summary || "Plain English document overview.",
      suggestions: actionable_suggestions
    };
  } catch (error) {
    console.error("Gemini API call failed, falling back to local legal AI engine:", error);
    return analyzeDocumentLocally(text, userProviderTitle, userCategory);
  }
}
