import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Printer,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Tag,
  ShieldAlert,
  XCircle,
  Award,
  Globe,
  List,
  Sparkles,
  ShieldCheck,
  Info,
  Clock,
  AlignLeft,
  Filter,
  Upload,
  RotateCcw,
  FileWarning
} from 'lucide-react';
import type {
  LegalAnalysisReport,
  DynamicClause,
  SmartActionStep,
  RiskLevel
} from '../types';
import { MANDATORY_DISCLAIMER, REJECTED_NON_LEGAL_NOTICE } from '../analysisEngine';

interface AnalysisResultsProps {
  report: LegalAnalysisReport;
  sourceText: string;
  providerTitle: string;
  domainCategory?: string;
  onSave: () => void;
  isSaved: boolean;
  onReset?: () => void;
}

type FilterTab = 'all' | 'high' | 'attention';

function getRatingConfig(rating: RiskLevel | string) {
  switch (rating) {
    case 'Critical':
      return {
        badge: 'bg-purple-500 text-white shadow-purple-500/20 shadow-md',
        pillBg: 'bg-purple-50 text-purple-800 border-purple-200',
        dot: 'bg-purple-500',
        icon: ShieldAlert,
        color: 'text-purple-700',
        label: 'Critical',
        accent: 'border-l-purple-500',
        subtleBg: 'bg-purple-50/50'
      };
    case 'High':
      return {
        badge: 'bg-rose-500 text-white shadow-rose-500/20 shadow-md',
        pillBg: 'bg-rose-50 text-rose-800 border-rose-200',
        dot: 'bg-rose-500',
        icon: ShieldAlert,
        color: 'text-rose-700',
        label: 'High',
        accent: 'border-l-rose-500',
        subtleBg: 'bg-rose-50/50'
      };
    case 'Medium':
      return {
        badge: 'bg-amber-500 text-white shadow-amber-500/20 shadow-md',
        pillBg: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
        icon: AlertTriangle,
        color: 'text-amber-700',
        label: 'Medium',
        accent: 'border-l-amber-500',
        subtleBg: 'bg-amber-50/50'
      };
    case 'Low':
    default:
      return {
        badge: 'bg-emerald-500 text-white shadow-emerald-500/20 shadow-md',
        pillBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-500',
        icon: CheckCircle,
        color: 'text-emerald-700',
        label: 'Low',
        accent: 'border-l-emerald-500',
        subtleBg: 'bg-emerald-50/50'
      };
  }
}

interface InsightsPanelProps {
  report: LegalAnalysisReport;
  sourceText: string;
  providerTitle: string;
  domainCategory?: string;
  onJumpToClause: (clauseId: string) => void;
  onShowAllClauses: () => void;
  selectedClauseId: string | null;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  report,
  sourceText,
  onJumpToClause,
  onShowAllClauses,
  selectedClauseId
}) => {
  const [textExpanded, setTextExpanded] = useState(false);
  const [stepsExpanded, setStepsExpanded] = useState(true);
  const [tocExpanded, setTocExpanded] = useState(true);
  const textContainerRef = useRef<HTMLDivElement>(null);

  const wordCount = useMemo(() => {
    const parts = sourceText.split(/\s+/).filter(Boolean);
    return parts.length;
  }, [sourceText]);

  const charCount = sourceText.length;
  const estReadMin = Math.max(1, Math.ceil(wordCount / 220));

  return (
    <aside className="w-full flex flex-col gap-4 lg:sticky lg:top-8 lg:self-start min-w-0">
      {/* Source Text Preview */}
      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden min-w-0">
        <button
          onClick={() => setTextExpanded(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors gap-3"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
              <AlignLeft className="w-4 h-4" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <h3 className="font-bold text-xs text-gray-900 tracking-tight whitespace-normal break-words min-w-0">
                Source Document Text
              </h3>
              <p className="text-[10px] text-gray-500 font-medium whitespace-normal break-words min-w-0">
                {wordCount.toLocaleString()} words · {charCount.toLocaleString()} chars · ~{estReadMin} min
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="hidden sm:inline text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap flex-shrink-0">
              {textExpanded ? 'Collapse' : 'Expand'}
            </span>
            {textExpanded ? <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />}
          </div>
        </button>
        {textExpanded && (
          <div
            ref={textContainerRef}
            className="border-t border-gray-100 bg-slate-50 px-5 py-4 max-h-[420px] overflow-y-auto scrollbar-thin min-w-0"
          >
            <pre className="text-[12px] leading-relaxed text-gray-800 font-sans whitespace-pre-wrap break-words word-break:break-word min-w-0 w-full max-w-full">
{sourceText}
            </pre>
          </div>
        )}
      </section>

      {/* Smart Action Steps */}
      {report.smart_action_steps && report.smart_action_steps.length > 0 && (
        <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-indigo-500/20 shadow-lg overflow-hidden min-w-0">
          <button
            onClick={() => setStepsExpanded(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors gap-3"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-400/30 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-4 h-4 text-brand-300" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h3 className="font-bold text-xs text-white tracking-tight whitespace-normal break-words min-w-0">
                  Smart Action Steps
                </h3>
                <p className="text-[10px] text-gray-400 font-medium whitespace-normal break-words min-w-0">
                  {report.smart_action_steps.length} prioritized actions
                </p>
              </div>
            </div>
            {stepsExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
          </button>
          {stepsExpanded && (
            <div className="border-t border-white/10 px-5 py-4 flex flex-col gap-3 min-w-0">
              {report.smart_action_steps.map((step: SmartActionStep, i: number) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3.5 hover:bg-white/10 transition-colors min-w-0">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-brand-500/30 text-brand-200 flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <p className="text-[12px] text-white font-bold leading-relaxed whitespace-normal break-words min-w-0">
                        {step.action_title}
                      </p>
                      {step.reasoning && (
                        <p className="text-[11px] text-gray-300 leading-relaxed font-medium whitespace-normal break-words min-w-0">
                          {step.reasoning}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Dynamic Table of Contents */}
      {report.clauses && report.clauses.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden min-w-0">
          <div className="w-full">
            <button
              onClick={() => setTocExpanded(v => !v)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors gap-3"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center flex-shrink-0">
                  <List className="w-4 h-4" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h3 className="font-bold text-xs text-gray-900 tracking-tight whitespace-normal break-words min-w-0">
                    Dynamic Table of Contents
                  </h3>
                  <p className="text-[10px] text-gray-500 font-medium whitespace-normal break-words min-w-0">
                    {report.clauses.length} discovered sections
                  </p>
                </div>
              </div>
              {tocExpanded ? <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />}
            </button>

            {tocExpanded && (
              <div className="px-5 pb-2 border-t border-gray-100 pt-2.5 min-w-0">
                <button
                  onClick={onShowAllClauses}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[11px] font-black transition-all border mb-2 ${
                    selectedClauseId === null
                      ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/20'
                      : 'bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5 whitespace-normal break-words min-w-0 flex-1">
                    <List className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>View All {report.clauses.length} Sections</span>
                  </span>
                  {selectedClauseId === null && (
                    <span className="text-[10px] font-black bg-white/25 text-white px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                      Active
                    </span>
                  )}
                </button>
                {selectedClauseId !== null && (
                  <div className="mb-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-start gap-2 min-w-0">
                    <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 whitespace-normal break-words min-w-0">
                        Single-Clause View
                      </span>
                      <span className="text-[11px] text-amber-900 font-bold leading-relaxed whitespace-normal break-words min-w-0">
                        Showing only the selected clause. Click &quot;View All {report.clauses.length} Sections&quot; above to restore.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {tocExpanded && (
            <div className="border-t border-gray-100 px-2 py-2.5 flex flex-col gap-1 max-h-[380px] overflow-y-auto scrollbar-thin min-w-0">
              {report.clauses.map((clause: DynamicClause, idx: number) => {
                const cfg = getRatingConfig(clause.risk_level);
                const CfgIcon = cfg.icon;
                const isActive = selectedClauseId === clause.clause_id;
                return (
                  <button
                    key={clause.clause_id}
                    onClick={() => onJumpToClause(clause.clause_id)}
                    aria-pressed={isActive}
                    className={`w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg group transition-all min-w-0 relative border ${
                      isActive
                        ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/25 ring-2 ring-brand-400/30'
                        : 'border-transparent hover:bg-brand-50 hover:border-brand-100'
                    }`}
                  >
                    <span className={`text-[11px] font-extrabold w-6 flex-shrink-0 tabular-nums text-right ${
                      isActive ? 'text-white/90' : 'text-gray-400 group-hover:text-brand-700'
                    }`}>
                      {idx + 1}.
                    </span>
                    <span className={`flex-1 text-[12px] font-semibold whitespace-normal break-words min-w-0 leading-snug ${
                      isActive ? 'text-white' : 'text-gray-800 group-hover:text-brand-700'
                    }`}>
                      {clause.dynamic_title}
                    </span>
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 ${
                      isActive ? 'bg-white/25' : cfg.pillBg
                    }`}>
                      <CfgIcon className={`w-3 h-3 ${isActive ? 'text-white' : cfg.color}`} />
                    </span>
                    {isActive && (
                      <span className="absolute -left-0.5 top-1 bottom-1 w-1 rounded-full bg-white/70 flex-shrink-0" aria-hidden />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}
    </aside>
  );
};

const ClauseCard: React.FC<{
  clause: DynamicClause;
  index: number;
  _sourceText: string;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
  isHighlighted: boolean;
}> = ({ clause, index, registerRef, isHighlighted }) => {
  const cfg = getRatingConfig(clause.risk_level);
  const CfgIcon = cfg.icon;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerRef(clause.clause_id, cardRef.current);
    return () => registerRef(clause.clause_id, null);
  }, [clause.clause_id]);

  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const tm = setTimeout(() => {
        if (cardRef.current) {
          cardRef.current.classList.remove('ring-4', 'ring-brand-400/60');
        }
      }, 2000);
      return () => clearTimeout(tm);
    }
  }, [isHighlighted]);

  const highlightTriggerWords = (sentence: string, triggers: string[]) => {
    if (!triggers || triggers.length === 0) return sentence;
    const sortedTriggers = [...triggers].sort((a, b) => b.length - a.length);
    const clean = sortedTriggers.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`(${clean.join('|')})`, 'gi');
    const parts = sentence.split(pattern);
    return parts.map((part, i) => {
      const isHit = sortedTriggers.some(t => typeof part === 'string' && part.length > 0 && part.toLowerCase() === t.toLowerCase());
      if (isHit) {
        return (
          <mark
            key={i}
            className="bg-amber-100 text-amber-900 border-b border-amber-300 rounded px-0.5 font-bold whitespace-normal break-words"
          >
            {part}
          </mark>
        );
      }
      return <span key={i} className="whitespace-normal break-words">{part}</span>;
    });
  };

  const semMatch = clause.semantic_validation?.semantic_match_percent ?? clause.validation.semantic_match_score;
  const legalKept = clause.semantic_validation?.legal_meaning_kept ?? clause.validation.legal_meaning_preserved;
  const misRisk = clause.semantic_validation?.misinterpretation_risk ?? clause.validation.risk_of_misinterpretation;
  const hasHallucinated = !(!clause.semantic_validation?.hallucinated_content || clause.semantic_validation.hallucinated_content === 'None' || clause.semantic_validation.hallucinated_content === 'none') || !!clause.validation.added_information;
  const hallucinatedLabel = hasHallucinated ? 'Detected' : 'None';

  const matchPctColor = semMatch >= 85 ? 'text-emerald-300' : semMatch >= 70 ? 'text-amber-300' : 'text-rose-300';
  const matchBarColor = semMatch >= 85 ? 'from-emerald-400 to-emerald-300' : semMatch >= 70 ? 'from-amber-400 to-amber-300' : 'from-rose-500 to-rose-400';
  const misRiskColor = misRisk === 'High' ? 'text-rose-300' : misRisk === 'Medium' ? 'text-amber-300' : 'text-emerald-300';

  return (
    <article
      ref={cardRef}
      id={`clause-${clause.clause_id}`}
      className={`bg-white border border-gray-200 rounded-2xl shadow-sm transition-all hover:shadow-lg hover:border-gray-300 overflow-hidden ${
        isHighlighted ? 'ring-4 ring-brand-400/60 z-10' : ''
      }`}
    >
      <header className={`px-6 py-4 border-b border-gray-100 flex items-start gap-4 border-l-8 ${cfg.accent}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center text-sm font-black flex-shrink-0">
            {index + 1}
          </div>
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <h4 className="text-base font-extrabold text-gray-900 leading-snug whitespace-normal break-words min-w-0 flex-1">
              {clause.dynamic_title}
            </h4>
          </div>
        </div>
        <span className={`text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 flex-shrink-0 ${cfg.badge}`}>
          <CfgIcon className="w-3.5 h-3.5" />
          <span>{cfg.label}</span>
        </span>
      </header>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <aside className="flex flex-col gap-4 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-baseline gap-2 flex-wrap min-w-0 flex-1">
              <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 whitespace-nowrap flex-shrink-0">
                Original Legal Text
              </h5>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0">
                char {clause.evidence.char_start}–{clause.evidence.char_end}
              </span>
            </div>
          </div>

          <blockquote className={`border-l-4 ${cfg.accent} bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 min-w-0`}>
            <p className="text-sm font-serif text-slate-800 leading-relaxed italic whitespace-normal break-words min-w-0">
              “{highlightTriggerWords(
                clause.evidence.original_legal_sentence || 'Source sentence not mapped.',
                clause.evidence.trigger_words || []
              )}”
            </p>
            {clause.evidence.trigger_words && clause.evidence.trigger_words.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-200/80 pt-3 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex-shrink-0">
                  Trigger words
                </span>
                {clause.evidence.trigger_words.map((tw, i) => (
                  <span
                    key={i}
                    className="font-mono text-[11px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded whitespace-normal break-words max-w-full"
                  >
                    {tw}
                  </span>
                ))}
              </div>
            )}
          </blockquote>
        </aside>

        <section className="flex flex-col gap-3 min-w-0">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white text-indigo-600 flex items-center justify-center border border-indigo-200 flex-shrink-0 font-black text-[11px]">
              1
            </div>
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h5 className="text-xs font-black uppercase tracking-wider text-indigo-700 whitespace-nowrap flex-shrink-0">
                  Plain English Summary
                </h5>
                <span className="text-[10px] font-bold text-indigo-500 bg-white/80 border border-indigo-200 px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                  Grade 7–8
                </span>
              </div>
              <p className="text-sm text-slate-900 leading-relaxed font-semibold whitespace-normal break-words min-w-0">
                {clause.plain_english_summary}
              </p>
            </div>
          </div>

          <div className={`${cfg.subtleBg} border border-gray-200 rounded-xl p-4 flex items-start gap-3 min-w-0`}>
            <div className="w-8 h-8 rounded-lg bg-white text-slate-700 flex items-center justify-center border border-gray-200 flex-shrink-0 font-black text-[11px]">
              2
            </div>
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 whitespace-nowrap flex-shrink-0">
                Why It Matters
              </h5>
              <p className="text-sm text-slate-800 leading-relaxed font-medium whitespace-normal break-words min-w-0">
                {clause.why_it_matters || 'Practical relevance not available for this clause.'}
              </p>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white text-emerald-600 flex items-center justify-center border border-emerald-200 flex-shrink-0 font-black text-[11px]">
              3
            </div>
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <h5 className="text-xs font-black uppercase tracking-wider text-emerald-700 whitespace-nowrap flex-shrink-0">
                Actionable Recommendation
              </h5>
              <p className="text-sm text-emerald-950 leading-relaxed font-bold whitespace-normal break-words min-w-0">
                {clause.recommendation || 'Review this clause carefully and consult legal counsel if you have questions.'}
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white text-amber-600 flex items-center justify-center border border-amber-200 flex-shrink-0 font-black text-[11px]">
              4
            </div>
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h5 className="text-xs font-black uppercase tracking-wider text-amber-700 whitespace-nowrap flex-shrink-0">
                  Potential User Impact
                </h5>
                <span className="text-[10px] font-bold text-amber-600 bg-white/80 border border-amber-200 px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                  Worst Case
                </span>
              </div>
              <p className="text-sm text-amber-950 leading-relaxed font-semibold whitespace-normal break-words min-w-0">
                {clause.potential_user_impact || 'No specific worst-case scenario was identified for this clause.'}
              </p>
            </div>
          </div>

          <div className={`${cfg.subtleBg} border border-gray-200 rounded-xl p-4 flex items-start gap-3 min-w-0`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-[11px] ${cfg.pillBg}`}>
              5
            </div>
            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 whitespace-nowrap flex-shrink-0">
                  Risk Rating &amp; Justification
                </h5>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${cfg.badge}`}>
                  {cfg.label} Risk
                </span>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed font-semibold whitespace-normal break-words min-w-0">
                {clause.risk_explanation || clause.interpretation?.risk_justification || `Rated ${cfg.label} risk based on clause analysis.`}
              </p>
            </div>
          </div>
        </section>

        <div className="md:col-span-2 w-full max-w-none block clear-both mt-2">
          <div className="rounded-2xl p-5 md:p-6 flex flex-col gap-4 md:gap-5 shadow-inner w-full max-w-full block bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-indigo-900/60">
            <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4 w-full">
              <div className="flex items-center gap-2.5 md:gap-3 flex-wrap flex-1 w-full">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center flex-shrink-0">
                  <Award className="w-4.5 h-4.5 md:w-5 md:h-5 text-indigo-300 flex-shrink-0" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs md:text-sm font-black uppercase tracking-[0.14em] text-indigo-300 whitespace-normal break-words">
                    Step 12 · Semantic Validation
                  </span>
                  <span className="text-[11px] md:text-xs text-slate-400 font-semibold whitespace-normal break-words">
                    LLM self-check comparing summary against the original source text
                  </span>
                </div>
              </div>
              <span className={`text-[10px] md:text-xs font-black px-3 md:px-3.5 py-1.5 md:py-2 rounded-lg border whitespace-nowrap flex-shrink-0 ${
                clause.validation.validation_status === 'PASSED'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                Status · {clause.validation.validation_status}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3 md:gap-5 w-full min-w-full">
              <div className="bg-white/5 rounded-xl border border-white/10 px-3 md:px-4 py-3.5 md:py-4.5 flex flex-col items-center justify-center gap-2 md:gap-2.5 w-full text-center overflow-visible">
                <span className="text-xs uppercase tracking-wider font-bold text-center whitespace-nowrap overflow-hidden text-ellipsis w-full text-slate-300">
                  Semantic Match
                </span>
                <div className="flex items-end gap-1">
                  <span className={`text-2xl md:text-3xl font-black tabular-nums whitespace-nowrap ${matchPctColor}`}>
                    {semMatch}
                  </span>
                  <span className="text-sm md:text-base font-bold text-slate-400 pb-0.5 md:pb-1 whitespace-nowrap">%</span>
                </div>
                <div className="h-2 md:h-2.5 rounded-full bg-white/5 overflow-hidden w-full">
                  <div className={`h-full rounded-full whitespace-normal bg-gradient-to-r ${matchBarColor}`} style={{ width: `${Math.max(0, Math.min(100, semMatch))}%` }} />
                </div>
              </div>
              <div className="bg-white/5 rounded-xl border border-white/10 px-3 md:px-4 py-3.5 md:py-4.5 flex flex-col items-center justify-center gap-2 md:gap-2.5 w-full text-center overflow-visible">
                <span className="text-xs uppercase tracking-wider font-bold text-center whitespace-nowrap overflow-hidden text-ellipsis w-full text-slate-300">
                  Legal Meaning
                </span>
                <span className="text-lg md:text-xl font-black flex items-center justify-center gap-1.5 text-white whitespace-nowrap">
                  {legalKept ? (
                    <><CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-emerald-400 flex-shrink-0" /> Yes</>
                  ) : (
                    <><XCircle className="w-5 h-5 md:w-6 md:h-6 text-rose-400 flex-shrink-0" /> No</>
                  )}
                </span>
                <span className="text-[11px] md:text-xs text-slate-500 font-semibold whitespace-normal w-full text-center leading-tight">
                  {legalKept ? 'Preserved' : 'Nuance lost'}
                </span>
              </div>
              <div className="bg-white/5 rounded-xl border border-white/10 px-3 md:px-4 py-3.5 md:py-4.5 flex flex-col items-center justify-center gap-2 md:gap-2.5 w-full text-center overflow-visible">
                <span className="text-xs uppercase tracking-wider font-bold text-center whitespace-nowrap overflow-hidden text-ellipsis w-full text-slate-300">
                  Misinterpret Risk
                </span>
                <span className={`text-lg md:text-xl font-black whitespace-nowrap ${misRiskColor}`}>
                  {misRisk}
                </span>
                <span className="text-[11px] md:text-xs text-slate-500 font-semibold whitespace-normal w-full text-center leading-tight">
                  Reader confusion risk
                </span>
              </div>
              <div className="bg-white/5 rounded-xl border border-white/10 px-3 md:px-4 py-3.5 md:py-4.5 flex flex-col items-center justify-center gap-2 md:gap-2.5 w-full text-center overflow-visible">
                <span className="text-xs uppercase tracking-wider font-bold text-center whitespace-nowrap overflow-hidden text-ellipsis w-full text-slate-300">
                  Hallucinated
                </span>
                <span className="text-lg md:text-xl font-black flex items-center justify-center gap-1.5 text-white whitespace-nowrap">
                  {!hasHallucinated ? (
                    <><CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-emerald-400 flex-shrink-0" /> None</>
                  ) : (
                    <><XCircle className="w-5 h-5 md:w-6 md:h-6 text-rose-400 flex-shrink-0" /> Yes</>
                  )}
                </span>
                <span className="text-[11px] md:text-xs text-slate-500 font-semibold whitespace-normal w-full text-center leading-tight">
                  {hallucinatedLabel}
                </span>
              </div>
            </div>

            <div className="w-full">
              <button
                onClick={() => setDetailsOpen(v => !v)}
                className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-300 hover:text-white transition-colors whitespace-nowrap flex-shrink-0"
              >
                <span>{detailsOpen ? 'Hide Full Validation Details' : 'Show Full Validation Details'}</span>
                {detailsOpen ? (
                  <ChevronUp className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 flex-shrink-0" />
                )}
              </button>

              {detailsOpen && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-sm md:text-base text-slate-200 w-full">
                  <div className="bg-white/5 rounded-xl border border-white/10 p-4 w-full">
                    <div className="flex items-center gap-2 mb-2 w-full flex-wrap">
                      <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-400 whitespace-nowrap flex-shrink-0">
                        Missing / Omitted Information
                      </span>
                    </div>
                    <p className="whitespace-normal break-words w-full leading-relaxed font-medium">
                      {clause.validation.missing_information || 'None — every nuance captured.'}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl border border-white/10 p-4 w-full">
                    <div className="flex items-center gap-2 mb-2 w-full flex-wrap">
                      <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-400 whitespace-nowrap flex-shrink-0">
                        Hallucinated / Added Content
                      </span>
                    </div>
                    <p className="whitespace-normal break-words w-full leading-relaxed font-medium">
                      {clause.semantic_validation?.hallucinated_content && clause.semantic_validation.hallucinated_content !== 'None' && clause.semantic_validation.hallucinated_content !== 'none'
                        ? clause.semantic_validation.hallucinated_content
                        : (clause.validation.added_information || 'None — no invented facts detected.')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  report,
  sourceText,
  providerTitle,
  domainCategory,
  onSave,
  isSaved,
  onReset
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [highlightedClauseId, setHighlightedClauseId] = useState<string | null>(null);
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null);
  const clauseRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const handlePrint = () => window.print();

  const registerRef = (id: string, el: HTMLDivElement | null) => {
    clauseRefs.current.set(id, el);
  };

  const onShowAllClauses = () => {
    setSelectedClauseId(null);
    window.requestAnimationFrame(() => {
      const targetEl = document.getElementById('clause-explorer-start');
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  const onJumpToClause = (clauseId: string) => {
    setSelectedClauseId(clauseId);
    setHighlightedClauseId(clauseId);
    window.requestAnimationFrame(() => {
      const el = clauseRefs.current.get(clauseId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.classList.add('ring-4', 'ring-brand-400/60', 'z-10');
        if ('focus' in el && typeof (el as HTMLElement).focus === 'function') {
          try { (el as HTMLElement).focus({ preventScroll: true }); } catch { /* focus optional */ }
        }
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-brand-400/60', 'z-10');
          if (highlightedClauseId === clauseId) setHighlightedClauseId(null);
        }, 2400);
      }
    });
  };

  // Guardrail rejection view — defense-in-depth. Normally the App layer intercepts
  // Not-a-Legal-Agreement reports BEFORE rendering this component, but if we end up
  // here anyway (e.g. user loaded a saved rejected document), provide a full reset UX.
  if (
    report.metadata.detected_type === 'Not a Legal Agreement' ||
    report.metadata.classification_confidence < 85 ||
    report.clauses.length === 0
  ) {
    return (
      <div className="flex flex-col gap-6 w-full animate-fade-in">
        <div className="bg-gradient-to-br from-red-50 via-white to-rose-50 border-2 border-red-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-6 md:px-8 pt-6 md:pt-8 pb-5 flex flex-col md:flex-row md:items-start gap-4 md:gap-5">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-red-100 text-red-600 border border-red-200 flex items-center justify-center flex-shrink-0 shadow-inner">
              <FileWarning className="w-7 h-7 md:w-8 md:h-8" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-[10px] md:text-[11px] font-extrabold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Input Document Validation Failure
                </span>
                <span className="text-[9px] md:text-[10px] font-extrabold uppercase tracking-wider bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full border border-red-200">
                  Classification Rejected
                </span>
              </div>
              <h3 className="font-extrabold text-lg md:text-xl text-red-900 leading-tight">
                This file cannot be analyzed by the Legal AI pipeline.
              </h3>
              <p className="text-[12px] md:text-sm font-bold text-red-800 mt-2 leading-relaxed">
                Classification: <span className="underline decoration-red-300 decoration-2">{report.metadata.detected_type}</span>
                {' · '}
                {report.metadata.classification_confidence}% Confidence
              </p>
            </div>
          </div>

          <div className="mx-6 md:mx-8 mb-5 bg-white border border-red-200 rounded-2xl p-4 md:p-5 shadow-sm">
            <p className="text-xs md:text-sm font-bold text-red-900 leading-relaxed">
              {REJECTED_NON_LEGAL_NOTICE}
            </p>
            {report.metadata.executive_overview && report.metadata.executive_overview !== REJECTED_NON_LEGAL_NOTICE && (
              <p className="text-[11px] md:text-xs font-mono text-red-800 leading-relaxed mt-3 pt-3 border-t border-dashed border-red-200">
                <strong className="font-bold non-mono tracking-wider text-red-700 uppercase text-[10px]">System Reasoning:&nbsp;</strong>
                {report.metadata.executive_overview}
              </p>
            )}
          </div>

          <div className="bg-white/80 border-t border-red-200/70 px-6 md:px-8 py-4.5 md:py-5 flex flex-col md:flex-row md:items-center gap-2.5 md:gap-3">
            {onReset ? (
              <>
                <button
                  type="button"
                  onClick={onReset}
                  className="flex-1 inline-flex items-center justify-center gap-2 font-bold text-xs md:text-sm py-3 md:py-3.5 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 transition-all active:scale-[0.99]"
                >
                  <Upload className="w-4 h-4 md:w-5 md:h-5" />
                  <span>Upload Another Document</span>
                </button>
                <button
                  type="button"
                  onClick={onReset}
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 font-bold text-xs md:text-sm py-3 md:py-3.5 px-5 rounded-xl bg-white hover:bg-gray-50 text-red-700 border border-red-200 transition-all active:scale-[0.99]"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset &amp; Try Again</span>
                </button>
              </>
            ) : (
              <div className="flex-1 text-xs md:text-sm font-semibold text-red-800 bg-red-100/70 border border-red-200 rounded-xl px-4 py-3">
                Navigate back to the Analyze tab to upload a valid Terms &amp; Conditions, Privacy Policy, or Legal Agreement.
              </div>
            )}
          </div>
        </div>

        {sourceText && sourceText.trim().length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden w-full">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                  <AlignLeft className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-gray-900">
                    Submitted Document Preview
                  </h4>
                  <p className="text-[10px] text-gray-500 font-medium">
                    {sourceText.trim().split(/\s+/).filter(Boolean).length.toLocaleString()} words · this text remains on screen for reference
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 max-h-[260px] overflow-y-auto scrollbar-thin bg-slate-50">
              <pre className="text-[11px] md:text-xs leading-relaxed text-gray-700 font-sans whitespace-pre-wrap break-words word-break:break-word">
                {sourceText}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  }

  const filteredClauses = useMemo(() => {
    switch (activeFilter) {
      case 'high':
        return report.clauses.filter(c => c.risk_level === 'Critical' || c.risk_level === 'High');
      case 'attention':
        return report.clauses.filter(c => c.risk_level === 'Medium' || c.risk_level === 'Critical' || c.risk_level === 'High' || c.validation.validation_status === 'FAILED');
      default:
        return report.clauses;
    }
  }, [report.clauses, activeFilter]);

  const displayedClauses = useMemo(
    () => (selectedClauseId
      ? filteredClauses.filter(c => c.clause_id === selectedClauseId)
      : filteredClauses),
    [filteredClauses, selectedClauseId]
  );

  const selectedClauseTitle = useMemo(() => {
    if (!selectedClauseId) return null;
    const hit = report.clauses.find(c => c.clause_id === selectedClauseId);
    return hit?.dynamic_title || null;
  }, [selectedClauseId, report.clauses]);

  const overallCfg = getRatingConfig(report.metadata.overall_risk);
  const OverallIcon = overallCfg.icon;

  const tabs: Array<{ id: FilterTab; label: string; count: number; tone: string }> = [
    { id: 'all', label: 'All Clauses', count: report.clauses.length, tone: 'neutral' },
    {
      id: 'high',
      label: 'High Risk',
      count: report.clauses.filter(c => c.risk_level === 'Critical' || c.risk_level === 'High').length,
      tone: 'danger'
    },
    {
      id: 'attention',
      label: 'Needs Attention',
      count: report.clauses.filter(c => c.risk_level !== 'Low' || c.validation.validation_status === 'FAILED').length,
      tone: 'warning'
    }
  ];

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in min-w-0">
      {/* DOCUMENT HEADER STRIP */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm relative overflow-hidden print:border-none print:shadow-none min-w-0">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500 rounded-t-2xl" />
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pt-1 min-w-0">
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5 min-w-0">
              <h2 className="font-extrabold text-xl text-gray-900 tracking-tight leading-tight whitespace-normal break-words min-w-0">
                {providerTitle}
              </h2>
              {/* Doc Type Badge */}
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                <Tag className="w-3 h-3 text-brand-500 flex-shrink-0" />
                <span>{report.metadata.detected_type}</span>
                <span className="opacity-75 ml-1 flex-shrink-0">({report.metadata.classification_confidence}%)</span>
              </span>
              <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                <Globe className="w-3 h-3 text-slate-500 flex-shrink-0" />
                <span>English</span>
              </span>
              {domainCategory && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200 whitespace-nowrap flex-shrink-0">
                  {domainCategory}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 font-medium min-w-0">
              <span className="flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                {Math.max(1, Math.ceil(sourceText.split(/\s+/).filter(Boolean).length / 220))} min read
              </span>
              <span className="flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                {sourceText.split(/\s+/).filter(Boolean).length.toLocaleString()} words
              </span>
              <span className="flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                <List className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                {report.metadata.total_clauses_analyzed} clauses analyzed
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 print:hidden min-w-0">
            {/* Overall Risk Level */}
            <span className={`text-xs font-black px-3 py-2 rounded-xl border flex items-center gap-1.5 shadow-sm whitespace-nowrap flex-shrink-0 ${overallCfg.pillBg}`}>
              <OverallIcon className={`w-4 h-4 flex-shrink-0 ${overallCfg.color}`} />
              <span>{overallCfg.label} Risk</span>
            </span>
            <button
              onClick={onSave}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm whitespace-nowrap flex-shrink-0 ${
                isSaved
                  ? 'bg-gray-100 border border-gray-300 text-gray-700'
                  : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20'
              }`}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Save Report</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              title="Export as PDF"
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors whitespace-nowrap flex-shrink-0"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Executive Summary Strip */}
        <div className="mt-4 bg-gradient-to-br from-indigo-50 via-indigo-50/70 to-purple-50/60 border border-indigo-100 rounded-2xl p-6 flex flex-col gap-4 shadow-md shadow-indigo-100 min-w-0 w-full">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-indigo-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="text-[11px] font-black uppercase tracking-[0.14em] text-indigo-600 whitespace-normal break-words min-w-0">
                Executive Overview
              </span>
              <p className="text-[12px] font-bold text-indigo-500/90 whitespace-normal break-words min-w-0">
                The only section you need to read to understand 100% of critical risks.
              </p>
            </div>
          </div>

          {/* Bottom Line */}
          <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm w-full min-w-0">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-sm">
                  <span className="text-xs font-black">BL</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                <h3 className="text-[12px] font-black uppercase tracking-wider text-indigo-600 whitespace-normal break-words min-w-0">
                  Bottom Line
                </h3>
                <p className="text-[15px] text-gray-900 leading-relaxed font-semibold whitespace-normal break-words min-w-0">
                  {report.metadata.executive?.bottom_line || report.metadata.executive_overview}
                </p>
              </div>
            </div>
          </div>

          {/* Top 4 Key Takeaways */}
          <div className="w-full min-w-0">
            <div className="flex items-center gap-2 mb-3 min-w-0 flex-wrap">
              <h3 className="text-[12px] font-black uppercase tracking-wider text-indigo-600 whitespace-nowrap flex-shrink-0">
                4 Biggest Risks (Key Takeaways)
              </h3>
              <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 to-transparent rounded-full min-w-[40px]" />
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0 w-full">
              {(() => {
                const bullets: string[] = Array.isArray(report.metadata.executive?.top_key_takeaways)
                  ? report.metadata.executive.top_key_takeaways.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
                  : [];
                while (bullets.length < 4) {
                  bullets.push('(No key takeaways generated — scroll to individual clause cards below for details.)');
                }
                const sliceOf4 = bullets.slice(0, 4);
                const kpiIcons = [AlertTriangle, ShieldAlert, Award, Lightbulb];
                const toneColors = [
                  'from-rose-50 to-white border-rose-100',
                  'from-amber-50 to-white border-amber-100',
                  'from-indigo-50 to-white border-indigo-100',
                  'from-emerald-50 to-white border-emerald-100'
                ];
                const chipColors = [
                  'bg-rose-100 text-rose-700 border-rose-200',
                  'bg-amber-100 text-amber-700 border-amber-200',
                  'bg-indigo-100 text-indigo-700 border-indigo-200',
                  'bg-emerald-100 text-emerald-700 border-emerald-200'
                ];
                const textColors = [
                  'text-rose-600',
                  'text-amber-600',
                  'text-indigo-600',
                  'text-emerald-600'
                ];
                return sliceOf4.map((txt, i) => {
                  const KpiIcon = kpiIcons[i] || AlertTriangle;
                  return (
                    <li
                      key={i}
                      className={`bg-gradient-to-br ${toneColors[i]} border rounded-2xl p-4 shadow-sm flex flex-col gap-2.5 min-w-0 w-full`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border whitespace-nowrap flex-shrink-0 ${chipColors[i]}`}>
                          Takeaway {i + 1}
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 min-w-0 w-full">
                        <div className={`flex-shrink-0 mt-0.5 ${textColors[i]}`}>
                          <KpiIcon className="w-4 h-4" />
                        </div>
                        <p className="text-[13.5px] leading-relaxed font-semibold text-gray-800 whitespace-normal break-words min-w-0 flex-1">
                          {txt}
                        </p>
                      </div>
                    </li>
                  );
                });
              })()}
            </ul>
          </div>
        </div>
      </div>

      {/* 35% / 65% MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
        {/* LEFT PANEL: FIXED INSIGHTS (35% ~ col-span-4 of 12) */}
        <div className="lg:col-span-4 xl:col-span-4 w-full min-w-0">
          <InsightsPanel
            report={report}
            sourceText={sourceText}
            providerTitle={providerTitle}
            domainCategory={domainCategory}
            onJumpToClause={onJumpToClause}
            onShowAllClauses={onShowAllClauses}
            selectedClauseId={selectedClauseId}
          />
        </div>

        {/* RIGHT PANEL: CLAUSE EXPLORER WORKSPACE (65% ~ col-span-8 of 12) */}
        <section id="clause-explorer-start" className="lg:col-span-8 xl:col-span-8 w-full flex flex-col gap-5 min-w-0" tabIndex={-1}>
          {/* Single-clause view banner */}
          {selectedClauseId !== null && (
            <div className="bg-gradient-to-br from-brand-50 via-white to-indigo-50 border border-brand-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0 w-full">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-700 whitespace-nowrap flex-shrink-0">
                      Single-Clause View
                    </span>
                    <span className="text-[10px] font-black bg-brand-600 text-white px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                      Showing 1 of {filteredClauses.length}
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-gray-900 leading-snug whitespace-normal break-words min-w-0">
                    {selectedClauseTitle || 'Selected Section'}
                  </p>
                  <p className="text-[12px] text-gray-500 font-semibold whitespace-normal break-words min-w-0">
                    {activeFilter !== 'all' ? `Showing the selected clause from the active &quot;${tabs.find(t => t.id === activeFilter)?.label || activeFilter}&quot; filter.` : 'Using the Table of Contents on the left you can navigate sections one at a time.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <button
                  onClick={onShowAllClauses}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-md shadow-brand-500/25 whitespace-nowrap flex-shrink-0 transition-all"
                >
                  <List className="w-4 h-4 flex-shrink-0" />
                  <span>View All {report.clauses.length} Sections</span>
                </button>
              </div>
            </div>
          )}

          {/* Filter Tabs: horizontal layout */}
          <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm flex flex-row flex-nowrap items-center gap-2 overflow-x-auto w-full min-w-0">
            <div className="flex items-center gap-1.5 px-3 py-2 text-gray-500 flex-shrink-0 rounded-xl bg-gray-50 border border-gray-100">
              <Filter className="w-4 h-4 flex-shrink-0" />
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-600 whitespace-nowrap flex-shrink-0">
                Filter
              </span>
            </div>
            <div className="flex flex-row flex-nowrap items-center gap-2 w-full min-w-0 overflow-x-auto">
              {tabs.map(tab => {
                const isActive = activeFilter === tab.id;
                const activeBg = tab.tone === 'danger'
                  ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                  : tab.tone === 'warning'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                  : 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/20';
                const countBg = isActive
                  ? tab.tone === 'danger' ? 'bg-white/25 text-white'
                  : tab.tone === 'warning' ? 'bg-white/25 text-white'
                  : 'bg-white/25 text-white'
                  : 'bg-gray-100 text-gray-700';
                const toneBg = isActive
                  ? activeBg
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300';
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap flex-shrink-0 ${toneBg}`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[11px] rounded-full px-2 py-0.5 font-black ${countBg}`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clause Cards */}
          <div className="flex flex-col gap-5 w-full min-w-0">
            {displayedClauses.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center min-w-0">
                <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-500 whitespace-normal break-words">
                  {selectedClauseId
                    ? 'This selected clause does not match the active filter. Clear selection to see all.'
                    : 'No clauses match the selected filter.'}
                </p>
                <p className="text-xs text-gray-400 mt-1 whitespace-normal break-words">
                  Try selecting &quot;All Clauses&quot; to see everything.
                </p>
                {(selectedClauseId || activeFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setActiveFilter('all');
                      onShowAllClauses();
                    }}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-sm whitespace-nowrap"
                  >
                    <List className="w-4 h-4" />
                    Reset &amp; View All {report.clauses.length} Sections
                  </button>
                )}
              </div>
            ) : (
              displayedClauses.map((clause, idx) => {
                const absoluteIndex = report.clauses.findIndex(c => c.clause_id === clause.clause_id);
                return (
                  <ClauseCard
                    key={clause.clause_id}
                    clause={clause}
                    index={absoluteIndex === -1 ? idx : absoluteIndex}
                    _sourceText={sourceText}
                    registerRef={registerRef}
                    isHighlighted={highlightedClauseId === clause.clause_id}
                  />
                );
              })
            )}
          </div>

          {/* Disclaimer */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-start gap-3 text-gray-500 print:mt-4 min-w-0 w-full">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
            <p className="text-[12px] font-medium leading-relaxed whitespace-normal break-words min-w-0">
              {MANDATORY_DISCLAIMER}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
