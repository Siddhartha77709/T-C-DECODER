import React from 'react';
import { 
  FileSearch, 
  Bookmark, 
  GitCompare, 
  Sliders 
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  savedCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ 
  activeTab, 
  setActiveTab, 
  savedCount 
}) => {
  const navItems = [
    { id: 'analyze', name: 'Decoder', icon: FileSearch },
    { id: 'saved', name: 'Reports', icon: Bookmark, count: savedCount },
    { id: 'compare', name: 'AI Validation', icon: GitCompare },
    { id: 'settings', name: 'Settings', icon: Sliders },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0F1117]/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-around pb-safe z-40 shadow-lg text-white">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="flex flex-col items-center justify-center w-16 h-12 relative group"
            aria-label={item.name}
          >
            <Icon 
              className={`w-5 h-5 transition-transform duration-200 active:scale-90 ${
                isActive ? 'text-brand-400 stroke-[2.3]' : 'text-gray-400 stroke-[1.8]'
              }`} 
            />
            <span className={`text-[10px] mt-1 transition-colors ${
              isActive ? 'text-white font-bold' : 'text-gray-400 font-medium'
            }`}>
              {item.name}
            </span>
            
            {/* Notification Badge */}
            {item.count !== undefined && item.count > 0 && (
              <span className="absolute top-0.5 right-3 bg-brand-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#0F1117]">
                {item.count}
              </span>
            )}
            
            {/* Active dot indicator */}
            {isActive && (
              <span className="absolute bottom-0 w-2 h-1 rounded-full bg-brand-400 animate-fade-in shadow-glow" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
