import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Lightbulb,
  FileText,
  ShieldAlert,
  BookOpen,
  Search,
  AlertTriangle,
  Info,
  CheckCircle,
  ChevronsDown,
  ChevronsUp,
  Sparkles
} from 'lucide-react';
import type { SavedDocument, DynamicClause, RiskLevel } from '../types';

interface CompareToolProps {
  savedDocs: SavedDocument[];
}

function getRiskBadge(level: RiskLevel | string) {
  switch (level) {
    case 'Critical':
      return { bg: 'bg-purple-100 text-purple-900 border-purple-300', Icon: ShieldAlert, color: 'text-purple-700' };
    case 'High':
      return { bg: 'bg-red-50 text-red-800 border-red-200', Icon: ShieldAlert, color: 'text-red-600' };
    case 'Medium':
      return { bg: 'bg-amber-50 text-amber-800 border-amber-200', Icon: AlertTriangle, color: 'text-amber-600' };
    case 'Low':
    default:
      return { bg: 'bg-green-50 text-green-800 border-green-200', Icon: CheckCircle, color: 'text-green-600' };
  }
}

function renderHighlightedQuote(quote: string, triggers: string[]): React.ReactNode {
  if (!triggers || triggers.length === 0 || !quote) return <>{quote}</>;
  const lowerQuote = quote.toLowerCase();
  let bestIdx = -1;
  let bestTrigger = '';
  for (const t of triggers) {
    const idx = lowerQuote.indexOf(t.toLowerCase());
    if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
      bestIdx = idx;
      bestTrigger = t;
    }
  }
  if (bestIdx === -1) return <>{quote}</>;

  const before = quote.substring(0, bestIdx);
  const matchedText = quote.substring(bestIdx, bestIdx + bestTrigger.length);
  const after = quote.substring(bestIdx + bestTrigger.length);

  return (
    <span>
      {before}
      <mark className="bg-amber-200 text-amber-950 font-extrabold px-1.5 py-0.5 rounded border border-amber-300">
        {matchedText}
      </mark>
      {after}
    </span>
  );
}

const ClauseValidationCard: React.FC<{
  clause: DynamicClause;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ clause, index, isExpanded, onToggle }) => {
  const badge = getRiskBadge(clause.risk_level);
  const BadgeIcon = badge.Icon;

  const fullSentence = clause.evidence?.original_legal_sentence || '';
  const triggerList = clause.evidence?.trigger_words || [];
  const triggerText = triggerList.join(', ');

  const summary = clause.plain_english_summary || '';
  const why = clause.why_it_matters || '';
  const rec = clause.recommendation || '';
  const impact = clause.potential_user_impact || '';
  const riskExpl = clause.risk_explanation || '';
  const validation = clause.validation;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition-all">
      <div
        onClick={onToggle}
        className="p-4 bg-gray-50/80 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-gray-100/60 transition-colors select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
            {index + 1}
          </div>
          <div className="flex flex-col">
            <h4 className="font-extrabold text-sm text-gray-900">
              {clause.dynamic_title}
            </h4>
            <span className="text-[10px] font-semibold text-gray-500 mt-0.5">
              Clause Traceability View — ID: {clause.clause_id?.slice(0, 8) || 'dynamic'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 justify-between sm:justify-end">
          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${badge.bg}`}>
            <BadgeIcon className={`w-3 h-3 ${badge.color}`} />
            <span>{clause.risk_level}</span>
          </span>
          <button className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white flex-shrink-0">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white animate-fade-in">

          <div className="lg:col-span-5 flex flex-col gap-3 border-r-0 lg:border-r border-gray-200 lg:pr-6">
            <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-gray-500" />
              Original Agreement Evidence
            </span>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                Exact Original Legal Sentence:
              </span>
              <blockquote className="text-xs text-gray-800 font-mono leading-relaxed whitespace-pre-line italic">
                "{renderHighlightedQuote(fullSentence, triggerList)}"
              </blockquote>
              {typeof clause.evidence?.char_start === 'number' && typeof clause.evidence?.char_end === 'number' && (
                <div className="text-[10px] font-bold text-gray-500 pt-1 border-t border-gray-200">
                  Source offsets: Pos {clause.evidence.char_start} – {clause.evidence.char_end} (chars)
                </div>
              )}
            </div>

            {triggerText && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col gap-1.5 text-xs">
                <span className="font-extrabold text-amber-950 flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-amber-600" />
                  Trigger Words / Evidence Tokens:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {triggerList.map((t, i) => (
                    <mark key={i} className="bg-amber-200 text-amber-950 font-extrabold px-1.5 py-0.5 rounded border border-amber-300 font-mono text-[11px]">
                      "{t}"
                    </mark>
                  ))}
                </div>
                <p className="text-amber-900 font-medium leading-relaxed text-[11px]">
                  These exact words from the original text were used by the LLM to anchor its summary and recommendation.
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 flex flex-col gap-3.5">
            <span className="text-xs font-extrabold text-brand-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              LLM Interpretation & Traceability
            </span>

            <div className="bg-brand-50/50 border border-brand-100 rounded-xl p-3.5 flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-extrabold text-brand-800 tracking-wider">
                1. Plain English Summary (Grade 7-8)
              </span>
              <p className="text-xs text-gray-900 font-bold leading-relaxed">
                {summary}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-extrabold text-slate-700 tracking-wider">
                2. Why It Matters
              </span>
              <p className="text-xs text-gray-700 font-medium leading-relaxed">
                {why}
              </p>
            </div>

            {(rec || impact) && (
              <div className="bg-amber-50/40 border border-amber-200/80 rounded-xl p-3.5 flex flex-col gap-2.5">
                {rec && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-extrabold text-amber-800 tracking-wider flex items-center gap-1">
                      <Lightbulb className="w-3 h-3 text-amber-600" />
                      3. Actionable Recommendation
                    </span>
                    <p className="text-xs text-gray-900 font-bold leading-relaxed">
                      {rec}
                    </p>
                  </div>
                )}
                {impact && (
                  <div className="border-t border-amber-200/50 pt-2 flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-extrabold text-amber-800 tracking-wider">
                      4. Potential User Impact (Worst Case)
                    </span>
                    <p className="text-xs text-gray-700 font-medium leading-relaxed">
                      {impact}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-start justify-between gap-3 text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="font-extrabold text-gray-600 text-[10px] uppercase tracking-wider">
                  5. Risk Rating & Justification
                </span>
                <p className="text-xs text-gray-700 font-medium leading-relaxed pr-2">
                  {riskExpl}
                </p>
              </div>
              <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border flex items-center gap-1.5 flex-shrink-0 ${badge.bg}`}>
                <BadgeIcon className={`w-3 h-3 ${badge.color}`} />
                {clause.risk_level}
              </span>
            </div>

            {validation && (
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-3.5 border border-indigo-500/30 flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                  <span className="text-[10px] font-extrabold uppercase text-brand-300 tracking-wider">
                    Step 12 — AI Semantic Validation
                  </span>
                  <span className={`text-[10px] font-bold ${validation.validation_status === 'PASSED' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {validation.validation_status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase font-bold">Semantic Match</span>
                    <span className="font-bold text-emerald-400">{validation.semantic_match_score}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase font-bold">Legal Kept</span>
                    <span className="font-bold text-white">{validation.legal_meaning_preserved ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase font-bold">Misinterpret Risk</span>
                    <span className={`font-bold ${validation.risk_of_misinterpretation === 'High' ? 'text-red-400' : validation.risk_of_misinterpretation === 'Medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {validation.risk_of_misinterpretation}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase font-bold">Hallucinated</span>
                    <span className={`font-bold ${validation.added_information ? 'text-red-400' : 'text-emerald-400'}`}>
                      {validation.added_information ? 'Yes' : 'None'}
                    </span>
                  </div>
                </div>
                {(validation.missing_information || validation.added_information) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[10px]">
                    {validation.missing_information && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                        <span className="text-amber-300 font-extrabold block mb-0.5">Omitted Info:</span>
                        <span className="text-gray-300 font-medium leading-relaxed">{validation.missing_information}</span>
                      </div>
                    )}
                    {validation.added_information && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                        <span className="text-red-300 font-extrabold block mb-0.5">Added (Hallucinated):</span>
                        <span className="text-gray-300 font-medium leading-relaxed">{validation.added_information}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export const CompareTool: React.FC<CompareToolProps> = ({ savedDocs }) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(savedDocs[0]?.id || '');

  const selectedDoc = useMemo(() =>
    savedDocs.find(d => d.id === selectedDocId) || savedDocs[0] || null
  , [selectedDocId, savedDocs]);

  const allClauses: DynamicClause[] = useMemo(
    () => selectedDoc?.report?.clauses || [],
    [selectedDoc]
  );

  const [prevAllClauses, setPrevAllClauses] = useState(allClauses);
  const [expandedIndexes, setExpandedIndexes] = useState<Set<number>>(
    new Set(allClauses.map((_, idx) => idx))
  );

  if (prevAllClauses !== allClauses) {
    setPrevAllClauses(allClauses);
    setExpandedIndexes(new Set(allClauses.map((_, idx) => idx)));
  }

  const handleExpandAll = () => {
    setExpandedIndexes(new Set(allClauses.map((_, idx) => idx)));
  };

  const handleCollapseAll = () => {
    setExpandedIndexes(new Set());
  };

  const toggleExpand = (idx: number) => {
    setExpandedIndexes(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const isExpanded = (idx: number) => expandedIndexes.has(idx);

  const metadata = selectedDoc?.report?.metadata;
  const overallBadge = metadata ? getRiskBadge(metadata.overall_risk) : null;

  if (savedDocs.length === 0) {
    return (
      <div className="flex flex-col gap-6 w-full animate-fade-in">
        <div className="flex flex-col gap-1">
          <h2 className="font-extrabold text-2xl text-gray-900 tracking-tight">
            AI Validation & Traceability
          </h2>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            Compare original agreement text against the LLM's interpretation. See exact evidence offsets, trigger tokens, and the self-validation score for every clause.
          </p>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-10 text-center shadow-sm flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-brand-600" />
          </div>
          <h3 className="font-extrabold text-base text-gray-900">No Saved Reports Found</h3>
          <p className="text-xs text-gray-500 max-w-md leading-relaxed font-medium">
            Run the 12-step AI pipeline and save a report first. Once saved, you can validate every clause against the original legal text with full character-level traceability.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in pb-16">

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700 uppercase tracking-wider">
            AI Traceability & Self-Validation
          </span>
        </div>
        <h2 className="font-extrabold text-2xl text-gray-900 tracking-tight">
          Original Text vs LLM Interpretation
        </h2>
        <p className="text-xs text-gray-500 font-medium leading-relaxed">
          See exactly which sentences and character positions anchored the LLM's dynamic summary, which trigger tokens were detected, and how the AI validated its own output for hallucinations.
        </p>
      </div>

      <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 flex flex-col gap-1.5">
          <label htmlFor="select-report-validate" className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-brand-600" />
            Select a Saved Report to Validate:
          </label>
          <select
            id="select-report-validate"
            value={selectedDocId}
            onChange={(e) => {
              setSelectedDocId(e.target.value);
            }}
            className="w-full bg-gray-50 text-xs font-bold text-gray-900 border border-gray-200 rounded-xl p-3 outline-none shadow-xs"
          >
            {savedDocs.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.provider_title || 'Untitled'} ({doc.report?.metadata?.detected_type || doc.category || 'General'}) — {new Date(doc.date).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>

        {selectedDoc && overallBadge && metadata && (
          <div className="flex items-center gap-2 sm:pt-4 flex-shrink-0">
            <span className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 shadow-sm ${overallBadge.bg}`}>
              <overallBadge.Icon className={`w-3.5 h-3.5 ${overallBadge.color}`} />
              Overall: {metadata.overall_risk}
            </span>
          </div>
        )}
      </div>

      {selectedDoc && metadata && (
        <>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-indigo-500 rounded-t-2xl" />

            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider">
                Document Metadata & Executive Overview
              </span>
              <h3 className="font-extrabold text-base text-gray-900">
                {selectedDoc.provider_title || 'Saved Document'} — {metadata.detected_type}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex flex-col gap-0.5">
                <span className="text-[9px] uppercase font-extrabold text-gray-400 tracking-wider">Detected Type</span>
                <p className="text-gray-900 font-extrabold">{metadata.detected_type}</p>
                <p className="text-gray-500 text-[10px]">{metadata.classification_confidence}% confidence</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex flex-col gap-0.5">
                <span className="text-[9px] uppercase font-extrabold text-gray-400 tracking-wider">Overall Risk</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {overallBadge && <overallBadge.Icon className={`w-3.5 h-3.5 ${overallBadge.color}`} />}
                  <p className="text-gray-900 font-extrabold">{metadata.overall_risk}</p>
                </div>
                <p className="text-gray-500 text-[10px]">{metadata.total_clauses_analyzed} clauses</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex flex-col gap-0.5">
                <span className="text-[9px] uppercase font-extrabold text-gray-400 tracking-wider">Smart Action Steps</span>
                <p className="text-gray-900 font-extrabold">{selectedDoc.report.smart_action_steps?.length ?? 0} items</p>
                <p className="text-gray-500 text-[10px]">LLM-generated recommendations</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-2">
                <span className="font-extrabold text-gray-900 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-brand-600" />
                  Executive Overview (Dynamic):
                </span>
                <p className="text-gray-700 leading-relaxed font-medium">
                  {metadata.executive_overview}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
              <span>Clause-by-Clause Evidence & Validation</span>
              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                {allClauses.length} clauses
              </span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExpandAll}
                className="flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100/80 px-3 py-1.5 rounded-xl border border-brand-200 transition-colors shadow-sm"
              >
                <ChevronsDown className="w-3.5 h-3.5" />
                Expand All
              </button>
              <button
                onClick={handleCollapseAll}
                className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl border border-gray-200 transition-colors shadow-sm"
              >
                <ChevronsUp className="w-3.5 h-3.5" />
                Collapse All
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {allClauses.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-500">
                  No clause details stored in this report.
                </p>
              </div>
            ) : (
              allClauses.map((clause, idx) => (
                <ClauseValidationCard
                  key={clause.clause_id || idx}
                  clause={clause}
                  index={idx}
                  isExpanded={isExpanded(idx)}
                  onToggle={() => toggleExpand(idx)}
                />
              ))
            )}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-start gap-3 text-gray-500">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
            <p className="text-[11px] font-medium leading-relaxed">
              Every summary, recommendation, and assessment above was generated in real time by the 12-step dynamic LLM pipeline. No rule engine, no hardcoded categories, no cached mock data. Evidence offsets refer to the exact character positions in the normalized source text.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
