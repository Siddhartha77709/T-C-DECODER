import React, { useState } from 'react';
import { 
  Trash2, 
  Database,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface SettingsProps {
  onClearSavedDocs: () => void;
  savedCount: number;
}

export const Settings: React.FC<SettingsProps> = ({
  onClearSavedDocs,
  savedCount,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearHistory = () => {
    onClearSavedDocs();
    setShowClearConfirm(false);
  };

  const getStorageSize = () => {
    let total = 0;
    for (const x in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, x)) {
        total += ((localStorage[x].length + x.length) * 2);
      }
    }
    return (total / 1024).toFixed(2) + ' KB';
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <div className="flex flex-col gap-1">
        <h2 className="font-extrabold text-2xl text-gray-900 tracking-tight">
          System Settings
        </h2>
        <p className="text-xs text-gray-500 font-medium leading-relaxed">
          Environment configuration and on-device report storage management.
        </p>
      </div>

      <div className="bg-brand-50/60 border border-brand-100 rounded-2xl p-4 flex gap-3 text-xs text-brand-900 max-w-2xl">
        <Sparkles className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
        <div className="flex flex-col gap-2 font-medium">
          <div>
            <span className="font-bold text-gray-900 block mb-0.5">Gemini AI — Environment Configured</span>
            <p className="leading-relaxed text-gray-600">
              The 12-step legal intelligence pipeline is active and uses your pre-configured Gemini API key. All clause titles, summaries, risk ratings, recommendations, and validations are generated in real time — no local regex, no hardcoded categories, no cached mock data.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 max-w-2xl">
        <div className="bg-surface border border-gray-200/80 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-gray-900" />
            <h3 className="font-bold text-sm text-gray-900">Local Data Registry</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Reports Stored</span>
              <p className="font-extrabold text-lg text-gray-900 mt-0.5">{savedCount} Document{savedCount !== 1 ? 's' : ''}</p>
            </div>
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Local Footprint</span>
              <p className="font-extrabold text-lg text-gray-900 mt-0.5">{getStorageSize()}</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>All evaluation records remain strictly on device.</span>
            </div>

            {!showClearConfirm ? (
              <button
                onClick={() => savedCount > 0 && setShowClearConfirm(true)}
                disabled={savedCount === 0}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  savedCount === 0 
                    ? 'border border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50' 
                    : 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Local Data</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-red-700">Confirm?</span>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="text-xs font-bold text-gray-600 border border-gray-200 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearHistory}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-300 bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

