import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Printer,
  Clock,
  FileText,
  Info,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Tag,
  ChevronsDown,
  ChevronsUp,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import type { AnalysisResult, AnalyzedClause, OverallRating, ActionableSuggestion } from '../types';

interface AnalysisResultsProps {
  result: AnalysisResult;
  onSave: () => void;
  isSaved: boolean;
  onCompare: () => void;
}

// Get rating styling badge without any percentages
function getRatingBadge(rating: OverallRating | string) {
  switch (rating) {
    case 'High Risk':
      return {
        bg: 'bg-red-50 text-red-800 border-red-200',
        icon: ShieldAlert,
        color: 'text-red-600',
        label: 'High Risk'
      };
    case 'Be Careful':
      return {
        bg: 'bg-orange-50 text-orange-800 border-orange-200',
        icon: AlertTriangle,
        color: 'text-orange-600',
        label: 'Be Careful'
      };
    case 'Needs Attention':
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: AlertTriangle,
        color: 'text-amber-600',
        label: 'Needs Attention'
      };
    case 'Balanced':
      return {
        bg: 'bg-blue-50 text-blue-800 border-blue-200',
        icon: Info,
        color: 'text-blue-600',
        label: 'Balanced'
      };
    case 'Mostly User Friendly':
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        icon: ShieldCheck,
        color: 'text-emerald-600',
        label: 'Mostly User Friendly'
      };
    case 'User Friendly':
    case 'Low Risk':
    default:
      return {
        bg: 'bg-green-50 text-green-800 border-green-200',
        icon: CheckCircle,
        color: 'text-green-600',
        label: rating === 'Low Risk' ? 'Low Risk' : 'User Friendly'
      };
  }
}

export const SmartSuggestionsCard: React.FC<{ suggestions: ActionableSuggestion[] }> = ({ suggestions }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-lg border border-indigo-500/20 flex flex-col gap-4 relative overflow-hidden animate-fade-in w-full">
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-5 h-5 text-brand-300" />
        </div>
        <div>
          <h3 className="font-extrabold text-base text-white tracking-tight">
            Smart Suggestions Before You Agree
          </h3>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">
            Practical steps derived directly from contract provisions — with reasoning explaining why each step is recommended.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {suggestions.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-brand-500/30 text-brand-200 flex items-center justify-center text-xs font-extrabold flex-shrink-0 mt-0.5">
              {idx + 1}
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs text-white font-bold leading-relaxed">
                {item.suggestion}
              </p>
              {item.reason && (
                <p className="text-[11px] text-gray-300 font-medium leading-relaxed flex items-center gap-1">
                  <span className="text-brand-300 font-bold">Why:</span> {item.reason}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ClauseCard: React.FC<{
  clause: AnalyzedClause;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ clause, index, isExpanded, onToggle }) => {
  const assessment = clause.overall_clause_assessment || clause.risk_level || 'Needs Attention';
  const badgeConfig = getRatingBadge(assessment);
  const Icon = badgeConfig.icon;

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
    <div className={`bg-white border rounded-2xl p-5 shadow-sm flex flex-col gap-3.5 transition-all hover:shadow-md ${
      clause.risk_level === 'High Risk' || clause.risk_level === 'RED' ? 'border-l-4 border-l-red-500 border-gray-200' :
      clause.risk_level === 'Be Careful' ? 'border-l-4 border-l-orange-400 border-gray-200' :
      clause.risk_level === 'Needs Attention' || clause.risk_level === 'YELLOW' ? 'border-l-4 border-l-amber-400 border-gray-200' :
      'border-l-4 border-l-emerald-400 border-gray-200'
    }`}>
      {/* Clause Title & Assessment Badge Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-extrabold flex-shrink-0">
            {index + 1}
          </div>
          <h4 className="font-bold text-sm text-gray-900 tracking-tight leading-snug">
            {clause.clause_title}
          </h4>
        </div>
        <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border flex items-center gap-1.5 flex-shrink-0 ${badgeConfig.bg}`}>
          <Icon className={`w-3.5 h-3.5 ${badgeConfig.color}`} />
          <span>{badgeConfig.label}</span>
        </span>
      </div>

      {/* Collapsed view content: Plain English Summary */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-3.5 flex flex-col gap-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
          Plain English Summary
        </span>
        <p className="text-xs text-gray-800 leading-relaxed font-medium">
          {summary}
        </p>
      </div>

      {/* Actionable recommendation preview */}
      {rec && (
        <div className="flex items-start gap-2 bg-indigo-50/70 border border-indigo-100/80 rounded-xl p-3">
          <Lightbulb className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500">
              Recommendation
            </span>
            <p className="text-xs text-indigo-950 font-semibold leading-relaxed">
              {rec}
            </p>
          </div>
        </div>
      )}

      {/* Toggle View Original Text & Deep AI Interpretation */}
      <div className="pt-1 flex flex-col gap-2">
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors w-fit group"
        >
          {isExpanded ? (
            <>
              <EyeOff className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>Hide Original Legal Wording & Evidence</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>View Original Legal Wording & Evidence</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>

        {isExpanded && (
          <div className="flex flex-col gap-3.5 mt-2 pt-3 border-t border-gray-100 animate-fade-in">
            {/* Full Contiguous Original Legal Wording */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                Exact Original Legal Sentence / Block:
              </span>
              <blockquote className="text-xs text-gray-700 font-mono bg-gray-50 border border-gray-200 border-l-4 border-l-gray-400 p-3 rounded-xl leading-relaxed italic whitespace-pre-line">
                "{fullSentence}"
              </blockquote>
            </div>

            {/* Trigger Words / Identified Evidence */}
            {triggerText && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <div className="flex flex-wrap items-center gap-1 text-xs">
                  <span className="font-bold text-amber-900">Trigger Words:</span>
                  <span className="font-mono bg-amber-200/80 text-amber-950 font-bold px-1.5 py-0.5 rounded">
                    "{triggerText}"
                  </span>
                </div>
              </div>
            )}

            {/* Interpretation Rationale */}
            {rationale && (
              <div className="flex flex-col gap-1 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Interpretation Rationale:
                </span>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  {rationale}
                </p>
              </div>
            )}

            {/* Potential User Impact */}
            {impact && (
              <div className="flex flex-col gap-1 bg-red-50/50 border border-red-100 rounded-xl p-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-600">
                  Direct User Impact:
                </span>
                <p className="text-xs text-red-950 font-medium leading-relaxed">
                  {impact}
                </p>
              </div>
            )}

            {/* Recommendation Rationale */}
            {recRationale && (
              <div className="flex flex-col gap-1 bg-indigo-50/50 border border-indigo-100 rounded-xl p-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
                  Why This Action Is Recommended:
                </span>
                <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                  {recRationale}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  result,
  onSave,
  isSaved,
  onCompare,
}) => {
  const {
    provider_title,
    domain_category,
    overall_rating,
    executive_summary,
    document_summary,
    legal_disclaimer,
    estimated_read_time_minutes,
    word_count,
    analyzed_clauses = [],
    clauses = []
  } = result;

  const allClauses = analyzed_clauses.length > 0 ? analyzed_clauses : clauses;
  const summaryText = document_summary || executive_summary;

  const [expandedClauseIds, setExpandedClauseIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setExpandedClauseIds(new Set());
  }, [result]);

  const handleExpandAll = () => {
    const allIds = new Set(allClauses.map(c => c.clause_id));
    setExpandedClauseIds(allIds);
  };

  const handleCollapseAll = () => {
    setExpandedClauseIds(new Set());
  };

  const toggleClause = (id: number) => {
    setExpandedClauseIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const overallBadge = getRatingBadge(overall_rating || 'Balanced');
  const OverallIcon = overallBadge.icon;

  const handlePrint = () => window.print();

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in print:p-0">

      {/* ── 1. DOCUMENT HEADER & OVERALL RATING ─────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden print:border-none print:shadow-none">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500 rounded-t-2xl" />

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pt-1">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-extrabold text-xl text-gray-900 tracking-tight leading-tight">
                {provider_title || 'Terms Agreement'}
              </h2>
              {domain_category && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5 text-gray-400" />
                  {domain_category}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 font-medium">
              {estimated_read_time_minutes > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {estimated_read_time_minutes} min read
                </span>
              )}
              {word_count > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  {word_count.toLocaleString()} words in original document
                </span>
              )}
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                {allClauses.length} legal clauses decoded
              </span>
            </div>
          </div>

          {/* Action Header Buttons & Rating Badge */}
          <div className="flex items-center gap-2.5 print:hidden">
            <span className={`text-xs font-extrabold px-3 py-2 rounded-xl border flex items-center gap-1.5 shadow-sm ${overallBadge.bg}`}>
              <OverallIcon className={`w-4 h-4 ${overallBadge.color}`} />
              <span>{overallBadge.label}</span>
            </span>

            <button
              onClick={onSave}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                isSaved
                  ? 'bg-gray-100 border border-gray-300 text-gray-700'
                  : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20'
              }`}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Saved
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" />
                  Save Report
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              title="Export as PDF"
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. PLAIN ENGLISH OVERVIEW ────────────────────────────────────────── */}
      {summaryText && (
        <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-5 flex flex-col gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
              Plain-English Overview
            </p>
          </div>
          <p className="text-sm text-gray-800 leading-relaxed font-medium">
            {summaryText}
          </p>
        </div>
      )}

      {/* ── 3. DECODED CLAUSES & GLOBAL CLAUSE CONTROLS ──────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-base text-gray-900 tracking-tight">
              Decoded Clauses & Line Traceability
            </h3>
            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
              {allClauses.length} total
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExpandAll}
              className="flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100/80 px-3 py-1.5 rounded-xl border border-brand-200 transition-colors shadow-sm"
            >
              <ChevronsDown className="w-3.5 h-3.5" />
              <span>Expand All</span>
            </button>
            <button
              onClick={handleCollapseAll}
              className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl border border-gray-200 transition-colors shadow-sm"
            >
              <ChevronsUp className="w-3.5 h-3.5" />
              <span>Collapse All</span>
            </button>
          </div>
        </div>

        {allClauses.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-500">
              No clauses were identified. Try pasting the full agreement text.
            </p>
          </div>
        ) : (
          allClauses.map((clause, idx) => (
            <ClauseCard
              key={clause.clause_id || idx}
              clause={clause}
              index={idx}
              isExpanded={expandedClauseIds.has(clause.clause_id)}
              onToggle={() => toggleClause(clause.clause_id)}
            />
          ))
        )}
      </div>

      {/* ── 4. LEGAL DISCLAIMER ────────────────────────────────────────────── */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-start gap-3 text-gray-500 print:mt-4">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
        <p className="text-[11px] font-medium leading-relaxed">
          {legal_disclaimer ||
            'T&C Decoder provides automated AI-generated summaries for informational purposes only. This report does not constitute professional legal advice.'}
        </p>
      </div>
    </div>
  );
};
