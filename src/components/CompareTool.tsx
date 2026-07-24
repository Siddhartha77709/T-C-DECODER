import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Lightbulb,
  FileText,
  ShieldCheck,
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
import type { SavedDocument, AnalyzedClause, OverallRating } from '../types';

interface CompareToolProps {
  savedDocs: SavedDocument[];
}

function getRatingBadge(rating: OverallRating | string) {
  switch (rating) {
    case 'High Risk':
      return { bg: 'bg-red-50 text-red-800 border-red-200', Icon: ShieldAlert, color: 'text-red-600' };
    case 'Be Careful':
      return { bg: 'bg-orange-50 text-orange-800 border-orange-200', Icon: AlertTriangle, color: 'text-orange-600' };
    case 'Needs Attention':
      return { bg: 'bg-amber-50 text-amber-800 border-amber-200', Icon: AlertTriangle, color: 'text-amber-600' };
    case 'Balanced':
      return { bg: 'bg-blue-50 text-blue-800 border-blue-200', Icon: Info, color: 'text-blue-600' };
    case 'Mostly User Friendly':
      return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', Icon: ShieldCheck, color: 'text-emerald-600' };
    case 'User Friendly':
    case 'Low Risk':
    default:
      return { bg: 'bg-green-50 text-green-800 border-green-200', Icon: CheckCircle, color: 'text-green-600' };
  }
}

function renderHighlightedQuote(quote: string, trigger: string): React.ReactNode {
  if (!trigger || !quote) return <>{quote}</>;
  const lowerQuote = quote.toLowerCase();
  const lowerTrigger = trigger.toLowerCase();
  const idx = lowerQuote.indexOf(lowerTrigger);
  if (idx === -1) return <>{quote}</>;

  const before = quote.substring(0, idx);
  const matchedText = quote.substring(idx, idx + trigger.length);
  const after = quote.substring(idx + trigger.length);

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
  clause: AnalyzedClause;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ clause, index, isExpanded, onToggle }) => {
  const assessment = clause.overall_clause_assessment || clause.risk_level || 'Needs Attention';
  const badge = getRatingBadge(assessment);
  const BadgeIcon = badge.Icon;

  const fullSentence = clause.exact_original_wording || clause.exact_verbatim_quote || '';
  const triggerText = (clause.trigger_words && clause.trigger_words.length > 0)
    ? clause.trigger_words.join(', ')
    : clause.highlighted_evidence || '';

  const summary = clause.plain_english_summary || clause.plain_english_translation || '';
  const rationale = clause.interpretation_rationale || clause.why_ai_summarized || '';
  const rec = clause.recommendation || '';
  const recRationale = clause.recommendation_rationale || clause.why_recommended || '';
  const impact = clause.user_impact || clause.potential_user_impact || '';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition-all">
      {/* Card Header */}
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
              {clause.clause_title}
            </h4>
            <span className="text-[10px] font-semibold text-gray-500 mt-0.5">
              Clause Traceability View
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 justify-between sm:justify-end">
          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${badge.bg}`}>
            <BadgeIcon className={`w-3 h-3 ${badge.color}`} />
            <span>{assessment}</span>
          </span>
          <button className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white flex-shrink-0">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2-Column Side-by-Side Validation Body */}
      {isExpanded && (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white animate-fade-in">

          {/* LEFT COLUMN: Original Agreement Text (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3 border-r-0 lg:border-r border-gray-200 lg:pr-6">
            <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-gray-500" />
              Original Agreement
            </span>

            {/* Full Contiguous Legal Sentence (NO HEADERS) */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                Exact Original Legal Sentence:
              </span>
              <blockquote className="text-xs text-gray-800 font-mono leading-relaxed whitespace-pre-line italic">
                "{renderHighlightedQuote(fullSentence, triggerText)}"
              </blockquote>
            </div>

            {/* Trigger Evidence Box */}
            {triggerText && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col gap-1.5 text-xs">
                <span className="font-extrabold text-amber-950 flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-amber-600" />
                  Trigger Words / Highlighted Evidence:
                </span>
                <div className="flex items-start gap-2">
                  <mark className="bg-amber-200 text-amber-950 font-extrabold px-1.5 py-0.5 rounded border border-amber-300 font-mono text-[11px]">
                    "{triggerText}"
                  </mark>
                </div>
                <p className="text-amber-900 font-medium leading-relaxed text-[11px]">
                  These exact words from the original text triggered the AI to generate its summary and recommendation.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: AI Interpretation & Traceability (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3.5">
            <span className="text-xs font-extrabold text-brand-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              AI Interpretation & Traceability
            </span>

            {/* Step 1: Plain English Summary */}
            <div className="bg-brand-50/50 border border-brand-100 rounded-xl p-3.5 flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-extrabold text-brand-800 tracking-wider">
                1. Plain English Summary
              </span>
              <p className="text-xs text-gray-900 font-bold leading-relaxed">
                {summary}
              </p>
            </div>

            {/* Step 2: Why AI summarized it this way */}
            {rationale && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-extrabold text-gray-600 tracking-wider">
                  2. Why Did the AI Interpret It This Way?
                </span>
                <p className="text-xs text-gray-700 font-medium leading-relaxed">
                  {rationale}
                </p>
              </div>
            )}

            {/* Steps 3 & 4: Recommendation + Reasoning */}
            {(rec || recRationale) && (
              <div className="bg-amber-50/40 border border-amber-200/80 rounded-xl p-3.5 flex flex-col gap-2.5">
                {rec && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-extrabold text-amber-800 tracking-wider flex items-center gap-1">
                      <Lightbulb className="w-3 h-3 text-amber-600" />
                      3. Recommendation
                    </span>
                    <p className="text-xs text-gray-900 font-bold leading-relaxed">
                      {rec}
                    </p>
                  </div>
                )}
                {recRationale && (
                  <div className="border-t border-amber-200/50 pt-2 flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-extrabold text-amber-800 tracking-wider">
                      4. Why Was This Recommended?
                    </span>
                    <p className="text-xs text-gray-700 font-medium leading-relaxed">
                      {recRationale}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Potential User Impact */}
            {impact && (
              <div className="bg-blue-50/40 border border-blue-200/80 rounded-xl p-3.5 flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-extrabold text-blue-900 tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  5. Potential User Impact
                </span>
                <p className="text-xs text-gray-800 font-medium leading-relaxed">
                  {impact}
                </p>
              </div>
            )}

            {/* Step 6: Overall Clause Assessment */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between text-xs">
              <span className="font-extrabold text-gray-600 text-[10px] uppercase tracking-wider">
                6. Overall Clause Assessment:
              </span>
              <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${badge.bg}`}>
                <BadgeIcon className={`w-3 h-3 ${badge.color}`} />
                {assessment}
              </span>
            </div>
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

  const allClauses = useMemo(
    () => selectedDoc?.analyzed_clauses || selectedDoc?.clauses || [],
    [selectedDoc]
  );

  // Use index-based keys to avoid undefined/duplicate clause_id issues with old saved docs
  const [expandedIndexes, setExpandedIndexes] = useState<Set<number>>(new Set());

  // Initialize all indexes as expanded when document or clause list changes
  useEffect(() => {
    if (allClauses.length > 0) {
      setExpandedIndexes(new Set(allClauses.map((_, idx) => idx)));
    } else {
      setExpandedIndexes(new Set());
    }
  }, [selectedDocId, allClauses]);

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

  const overallBadge = selectedDoc ? getRatingBadge(selectedDoc.overall_rating || selectedDoc.verdict || 'Balanced') : null;

  if (savedDocs.length === 0) {
    return (
      <div className="flex flex-col gap-6 w-full animate-fade-in">
        <div className="flex flex-col gap-1">
          <h2 className="font-extrabold text-2xl text-gray-900 tracking-tight">
            AI Validation
          </h2>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            Compare original agreement text against the AI's interpretation. See exactly why every clause was summarized the way it was.
          </p>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-10 text-center shadow-sm flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-brand-600" />
          </div>
          <h3 className="font-extrabold text-base text-gray-900">No Saved Reports Found</h3>
          <p className="text-xs text-gray-500 max-w-md leading-relaxed font-medium">
            Analyze and save an agreement in the <strong className="text-gray-800">T&C Decoder</strong> tab first. Once saved, you can validate the AI's reasoning here against the original legal text.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in pb-16">

      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700 uppercase tracking-wider">
            AI Traceability & Validation
          </span>
        </div>
        <h2 className="font-extrabold text-2xl text-gray-900 tracking-tight">
          Original Agreement vs AI Interpretation
        </h2>
        <p className="text-xs text-gray-500 font-medium leading-relaxed">
          See exactly how the AI read the original legal text, which exact words triggered each summary, and why every recommendation was generated.
        </p>
      </div>

      {/* Report Selector */}
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
                {doc.companyName} ({doc.domain_category || doc.category || 'General'}) — {new Date(doc.date).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>

        {selectedDoc && overallBadge && (
          <div className="flex items-center gap-2 sm:pt-4 flex-shrink-0">
            <span className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 shadow-sm ${overallBadge.bg}`}>
              <overallBadge.Icon className={`w-3.5 h-3.5 ${overallBadge.color}`} />
              {selectedDoc.overall_rating || selectedDoc.verdict}
            </span>
          </div>
        )}
      </div>

      {selectedDoc && (
        <>
          {/* Executive Summary Rationale Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-indigo-500 rounded-t-2xl" />

            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider">
                Overall Document Summary & AI Rationale
              </span>
              <h3 className="font-extrabold text-base text-gray-900">
                {selectedDoc.companyName} — Full Overview
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* AI Summary Output */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col gap-2">
                <span className="font-extrabold text-gray-900 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-brand-600" />
                  AI Plain-English Summary:
                </span>
                <p className="text-gray-700 leading-relaxed font-medium">
                  {selectedDoc.executive_summary || selectedDoc.document_summary || selectedDoc.quickNote}
                </p>
              </div>

              {/* Why AI generated this */}
              <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100 flex flex-col gap-2">
                <span className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-indigo-600" />
                  Why Did the AI Generate This Summary?
                </span>
                <p className="text-gray-700 leading-relaxed font-medium">
                  Because the original agreement for <strong>{selectedDoc.companyName}</strong> contains
                  {selectedDoc.quick_matrix?.mandatory_arbitration ? ' mandatory arbitration clauses,' : ''}
                  {selectedDoc.quick_matrix?.waives_class_action ? ' class action waivers,' : ''}
                  {selectedDoc.quick_matrix?.sells_or_monetizes_data ? ' data monetization provisions,' : ''}
                  {selectedDoc.quick_matrix?.auto_renewal_charges ? ' automatic renewal obligations,' : ''}
                  {' '}and{' '}{allClauses.length} legal clause{allClauses.length !== 1 ? 's' : ''} that were extracted and evaluated for user impact.
                </p>
              </div>
            </div>
          </div>

          {/* Clause Controls Header */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
              <span>Clause-by-Clause Evidence</span>
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

          {/* Clause Cards */}
          <div className="flex flex-col gap-5">
            {allClauses.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-500">
                  No clause details are stored in this saved report. Re-analyze the agreement to generate full traceability data.
                </p>
              </div>
            ) : (
              allClauses.map((clause, idx) => (
                <ClauseValidationCard
                  key={idx}
                  clause={clause}
                  index={idx}
                  isExpanded={isExpanded(idx)}
                  onToggle={() => toggleExpand(idx)}
                />
              ))
            )}
          </div>

          {/* AI Validation Footer */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-start gap-3 text-gray-500">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
            <p className="text-[11px] font-medium leading-relaxed">
              Every summary, recommendation, and assessment shown here was generated by the T&C Decoder AI based strictly on the original agreement text. No legal meanings were invented or assumed. Only clauses explicitly present in the original document were analyzed.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
