import React from 'react';
import { Shield, Sparkles, User, Cpu } from 'lucide-react';

interface HeaderProps {
  isApiConfigured: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isApiConfigured }) => {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0F1117]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 z-40 text-white shadow-lg">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-md">
          <Shield className="w-4.5 h-4.5 text-white stroke-[2.2]" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base tracking-tight text-white leading-tight">T&C Decoder</span>
          <span className="text-[9px] font-semibold text-brand-300 tracking-wider uppercase">Legal AI Intelligence</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2.5">
        <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
          isApiConfigured 
            ? 'bg-brand-500/20 text-brand-300 border-brand-500/30' 
            : 'bg-white/10 text-gray-300 border-white/10'
        }`}>
          {isApiConfigured ? (
            <>
              <Sparkles className="w-3 h-3 text-brand-400 animate-pulse" />
              <span>Gemini AI</span>
            </>
          ) : (
            <>
              <Cpu className="w-3 h-3 text-gray-400" />
              <span>Local Core</span>
            </>
          )}
        </div>
        
        <button 
          aria-label="User Profile"
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10 hover:bg-white/20 transition-colors"
        >
          <User className="w-4 h-4 text-gray-200" />
        </button>
      </div>
    </header>
  );
};
