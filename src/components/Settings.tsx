import React, { useState } from 'react';
import { 
  Key, 
  Eye, 
  EyeOff, 
  Trash2, 
  ShieldAlert, 
  Database,
  Sparkles,
  Info,
  Check,
  Cpu
} from 'lucide-react';

interface SettingsProps {
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  onClearSavedDocs: () => void;
  savedCount: number;
}

export const Settings: React.FC<SettingsProps> = ({
  apiKey,
  onSaveApiKey,
  onClearSavedDocs,
  savedCount,
}) => {
  const [keyInput, setKeyInput] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  
  const [thresholds, setThresholds] = useState({
    classAction: true,
    dataSelling: true,
    autoRenew: true,
    liabilityCap: true,
  });

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(keyInput.trim());
    setShowSavedMsg(true);
    setTimeout(() => setShowSavedMsg(false), 3000);
  };

  const handleClearHistory = () => {
    if (window.confirm("Permanently clear all saved legal evaluation reports? This action cannot be reverted.")) {
      onClearSavedDocs();
    }
  };

  const getStorageSize = () => {
    let total = 0;
    for (const x in localStorage) {
      if (localStorage.hasOwnProperty(x)) {
        total += ((localStorage[x].length + x.length) * 2);
      }
    }
    return (total / 1024).toFixed(2) + ' KB';
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <div className="flex flex-col gap-1">
        <h2 className="font-extrabold text-2xl text-gray-900 tracking-tight">
          System Settings & AI Configuration
        </h2>
        <p className="text-xs text-gray-500 font-medium leading-relaxed">
          Configure AI evaluation keys and customize compliance alert sensitivity.
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-brand-50/60 border border-brand-100 rounded-2xl p-4 flex gap-3 text-xs text-brand-900 max-w-2xl">
        <Info className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
        <div className="flex flex-col gap-2 font-medium">
          <div>
            <span className="font-bold text-gray-900 block mb-0.5">Gemini AI Key Integration</span>
            <p className="leading-relaxed text-gray-600">
              Adding your free Google Gemini API Key enables deep neural evaluation of full contract texts, identifying subtle liability risks beyond local rule matching.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 max-w-2xl">
        {/* 1. API Configuration */}
        <div className="bg-surface border border-gray-200/80 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-600" />
              <h3 className="font-bold text-sm text-gray-900">Gemini Pro API Key</h3>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
              apiKey ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}>
              {apiKey ? 'Configured & Active' : 'Offline Mode'}
            </span>
          </div>

          <form onSubmit={handleSaveKey} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="gemini-key" className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Gemini API Key String</label>
              <div className="relative">
                <input
                  id="gemini-key"
                  type={showKey ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Paste your AIzaSy... key string"
                  className="w-full bg-gray-50 text-xs border border-gray-200 rounded-xl p-2.5 pr-10 font-mono input-focus"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200/50 transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 mt-1">
              <a 
                href="https://aistudio.google.com/" 
                target="_blank" 
                rel="noreferrer" 
                className="text-xs text-brand-600 hover:text-brand-700 font-bold hover:underline"
              >
                Get a free API key from Google AI Studio
              </a>

              <div className="flex items-center gap-2">
                {showSavedMsg && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved</span>
                  </span>
                )}
                <button
                  type="submit"
                  className="bg-brand-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Update Key</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* 2. Custom Toggles */}
        <div className="bg-surface border border-gray-200/80 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-gray-900" />
            <h3 className="font-bold text-sm text-gray-900">Compliance Audit Rules</h3>
          </div>

          <div className="flex flex-col gap-3.5">
            {[
              { id: 'classAction', label: "Flag Mandatory Arbitration & Class Action Waivers" },
              { id: 'dataSelling', label: "Flag Data Transfer & AI Model Training Permissions" },
              { id: 'autoRenew', label: "Flag Automatic Billing Renewals" },
              { id: 'liabilityCap', label: "Flag Disclaimers & Capped Recourse Limits" }
            ].map(item => (
              <div key={item.id} className="flex items-center justify-between gap-3 select-none">
                <span className="text-xs font-semibold text-gray-800">{item.label}</span>
                <div 
                  onClick={() => setThresholds({
                    ...thresholds,
                    [item.id]: !thresholds[item.id as keyof typeof thresholds]
                  })}
                  className={`toggle-track ${thresholds[item.id as keyof typeof thresholds] ? 'active' : ''}`}
                >
                  <div className="toggle-thumb" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Cache & Storage */}
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
              <Cpu className="w-3.5 h-3.5" />
              <span>All evaluation records remain strictly on device.</span>
            </div>

            <button
              onClick={handleClearHistory}
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
          </div>
        </div>
      </div>
    </div>
  );
};
