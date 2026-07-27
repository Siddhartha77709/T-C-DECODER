import React from 'react';
import { 
  FileSearch, 
  Bookmark, 
  GitCompare, 
  Sliders, 
  Shield, 
  Sparkles,
  Brain,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  savedCount: number;
  processingStep?: number | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  savedCount,
  processingStep
}) => {
  const menuItems = [
    { id: 'analyze', name: 'Document Decoder', icon: FileSearch, desc: 'Decode contracts & agreements' },
    { id: 'saved', name: 'Saved Reports', icon: Bookmark, count: savedCount, desc: 'Archived evaluations' },
    { id: 'compare', name: 'AI Validation', icon: GitCompare, desc: 'Original agreement vs AI analysis' },
    { id: 'settings', name: 'System Settings', icon: Sliders, desc: 'Local storage & environment' },
  ];

  const isProcessing = typeof processingStep === 'number' && processingStep > 0;

  return (
    <aside className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-64 bg-navy-gradient border-r border-white/10 p-5 z-30 justify-between text-white shadow-sidebar">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 py-2 px-1 border-b border-white/10 pb-5">
          <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Shield className="w-5 h-5 text-white stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-white leading-tight">T&C Decoder</span>
            <span className="text-[10px] font-semibold text-brand-300 tracking-wider uppercase">Legal AI Intelligence</span>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-200 group text-left relative ${
                  isActive 
                    ? 'nav-item-active text-white' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-brand-400' : 'text-gray-400'
                  }`} />
                  <div className="flex flex-col">
                    <span className={`text-xs ${isActive ? 'font-bold text-white' : 'font-semibold'}`}>{item.name}</span>
                    {item.desc && (
                      <span className="text-[10px] text-gray-400/80 font-normal leading-tight mt-0.5">{item.desc}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      isActive ? 'bg-brand-500 text-white' : 'bg-white/10 text-gray-300'
                    }`}>
                      {item.count}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 text-brand-400 opacity-80" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-3">
        <div className={`p-3.5 rounded-xl border flex flex-col gap-2 transition-all ${
          isProcessing
            ? 'bg-amber-950/60 border-amber-500/40'
            : 'bg-brand-950/60 border-brand-500/30'
        }`}>
          <div className="flex items-center gap-2 text-xs font-bold">
            {isProcessing ? (
              <>
                <Brain className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-amber-200">LLM Pipeline Running</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
                <span className="text-brand-200">T&amp;C LLM Ready</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
            {isProcessing
              ? `Executing 12-step dynamic legal intelligence pipeline on uploaded document (step ${processingStep}/12).`
              : "AI Assistant active — dedicated to helping you analyze, decode, and understand complex terms and conditions."}
          </p>
        </div>
        
        <div className="text-[10px] text-gray-400/70 px-1 font-medium flex items-center justify-between">
          <span>T&C Decoder Engine</span>
          <span>v3.0 Dynamic AI</span>
        </div>
      </div>
    </aside>
  );
};
