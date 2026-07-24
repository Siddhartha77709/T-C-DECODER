import React from 'react';
import {
  Trash2,
  Calendar,
  FileText,
  ChevronRight,
  Bookmark,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
  Info
} from 'lucide-react';
import type { SavedDocument, OverallRating } from '../types';

interface SavedDocsProps {
  documents: SavedDocument[];
  onSelect: (doc: SavedDocument) => void;
  onDelete: (id: string) => void;
  onNavigateToAnalyze: () => void;
}

function getRatingBadge(rating: OverallRating | string) {
  switch (rating) {
    case 'High Risk':
      return {
        bg: 'bg-red-100 text-red-800 border-red-200',
        Icon: ShieldAlert,
        color: 'text-red-600',
        label: 'High Risk'
      };
    case 'Be Careful':
      return {
        bg: 'bg-orange-100 text-orange-800 border-orange-200',
        Icon: AlertTriangle,
        color: 'text-orange-600',
        label: 'Be Careful'
      };
    case 'Needs Attention':
      return {
        bg: 'bg-amber-100 text-amber-800 border-amber-200',
        Icon: AlertTriangle,
        color: 'text-amber-700',
        label: 'Needs Attention'
      };
    case 'Balanced':
      return {
        bg: 'bg-blue-100 text-blue-800 border-blue-200',
        Icon: Info,
        color: 'text-blue-600',
        label: 'Balanced'
      };
    case 'Mostly User Friendly':
      return {
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        Icon: ShieldCheck,
        color: 'text-emerald-600',
        label: 'Mostly User Friendly'
      };
    case 'User Friendly':
    default:
      return {
        bg: 'bg-green-100 text-green-800 border-green-200',
        Icon: CheckCircle,
        color: 'text-green-600',
        label: 'User Friendly'
      };
  }
}

export const SavedDocs: React.FC<SavedDocsProps> = ({
  documents,
  onSelect,
  onDelete,
  onNavigateToAnalyze,
}) => {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <div className="flex flex-col gap-1">
        <h2 className="font-extrabold text-2xl text-gray-900 tracking-tight">
          Saved Reports
        </h2>
        <p className="text-xs text-gray-500 font-medium leading-relaxed">
          Archived analysis reports stored on your device. Click any report to view the full evaluation without re-analyzing.
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="bg-surface border border-gray-200/80 rounded-3xl p-10 text-center shadow-sm py-16 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-4">
            <Bookmark className="w-7 h-7 text-gray-400 stroke-[1.8]" />
          </div>
          <h3 className="font-extrabold text-base text-gray-900 mb-1">
            No Saved Reports Yet
          </h3>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed font-medium">
            After analyzing any agreement, click "Save Report" to archive it here for instant future access.
          </p>
          <button
            onClick={onNavigateToAnalyze}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-colors shadow-sm"
          >
            <span>Analyze an Agreement</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {documents.map((doc) => {
            const rating = doc.overall_rating || doc.verdict || 'Balanced';
            const badge = getRatingBadge(rating);
            const BadgeIcon = badge.Icon;
            const clauseCount = doc.analyzed_clauses?.length || 0;

            return (
              <div
                key={doc.id}
                onClick={() => onSelect(doc)}
                className="bg-surface border border-gray-200/80 rounded-2xl p-5 shadow-sm card-hover cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                {/* Left: Info section */}
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-extrabold text-base text-gray-900 tracking-tight group-hover:text-brand-600 transition-colors">
                      {doc.companyName}
                    </h3>

                    {/* Descriptive rating badge — NO percentages */}
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${badge.bg}`}>
                      <BadgeIcon className={`w-3 h-3 ${badge.color}`} />
                      {badge.label}
                    </span>

                    <span className="text-[10px] text-gray-500 font-bold bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
                      {doc.category || doc.domain_category || 'General'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 font-medium line-clamp-2 leading-relaxed">
                    {doc.executive_summary || doc.quickNote}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-400 font-semibold mt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Saved {formatDate(doc.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{doc.estimatedReadTime}</span>
                    </div>
                    {clauseCount > 0 && (
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{clauseCount} clauses analyzed</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Action column */}
                <div className="flex items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 justify-between md:justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(doc.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Delete saved report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="p-1.5 text-gray-400 group-hover:translate-x-1 transition-transform">
                    <ChevronRight className="w-5 h-5 text-gray-800" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
