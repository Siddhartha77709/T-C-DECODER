import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  Database,
  Sparkles,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Save,
  XCircle
} from 'lucide-react';
import { getUserProvidedApiKeyStorageKey } from '../analysisEngine';

interface SettingsProps {
  onClearSavedDocs: () => void;
  savedCount: number;
}

type KeySource = 'import.meta.env' | 'process.env' | 'localStorage.user' | 'none';

type NodeProcessEnvShape = { VITE_GEMINI_API_KEY?: string; GEMINI_API_KEY?: string };
type NodeProcessShape = { env?: NodeProcessEnvShape };

function getNodeProcessOrNull(): NodeProcessShape | null {
  try {
    const g = globalThis as unknown as { process?: NodeProcessShape };
    if (g && typeof g.process === 'object' && g.process !== null && typeof g.process.env === 'object' && g.process.env !== null) {
      return g.process;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function detectActiveKeySource(userKeySet: boolean): KeySource {
  if (typeof import.meta !== 'undefined' && import.meta?.env && typeof import.meta.env.VITE_GEMINI_API_KEY === 'string') {
    const k = import.meta.env.VITE_GEMINI_API_KEY.trim();
    if (k.length > 0) return 'import.meta.env';
  }
  const nodeProcess = getNodeProcessOrNull();
  if (nodeProcess && nodeProcess.env) {
    const fromProcessEnv = (nodeProcess.env.VITE_GEMINI_API_KEY || nodeProcess.env.GEMINI_API_KEY || '').trim();
    if (fromProcessEnv.length > 0) return 'process.env';
  }
  if (userKeySet) return 'localStorage.user';
  return 'none';
}

export const Settings: React.FC<SettingsProps> = ({
  onClearSavedDocs,
  savedCount,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const storageKey = getUserProvidedApiKeyStorageKey();
  const [userApiKey, setUserApiKey] = useState<string>('');
  const [revealKey, setRevealKey] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'removed'>('idle');
  const [activeSource, setActiveSource] = useState<KeySource>('none');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey) || '';
      setUserApiKey(stored);
      setActiveSource(detectActiveKeySource(stored.trim().length > 0));
    } catch {
      setActiveSource(detectActiveKeySource(false));
    }
  }, [storageKey]);

  const handleSaveUserKey = () => {
    try {
      const trimmed = userApiKey.trim();
      if (trimmed.length === 0) {
        window.localStorage.removeItem(storageKey);
        setSaveStatus('removed');
      } else {
        window.localStorage.setItem(storageKey, trimmed);
        setSaveStatus('saved');
      }
      setActiveSource(detectActiveKeySource(trimmed.length > 0));
      window.setTimeout(() => setSaveStatus('idle'), 2200);
    } catch (err) {
      console.error('[Settings] Failed to persist user API key in localStorage.', err);
    }
  };

  const handleClearUserKey = () => {
    setUserApiKey('');
    try {
      window.localStorage.removeItem(storageKey);
      setSaveStatus('removed');
      setActiveSource(detectActiveKeySource(false));
      window.setTimeout(() => setSaveStatus('idle'), 2200);
    } catch {
      /* ignore */
    }
  };

  const sourceLabelMap: Record<KeySource, { label: string; color: string; badge: string }> = {
    'import.meta.env': {
      label: 'Environment Variable · import.meta.env.VITE_GEMINI_API_KEY',
      color: 'text-emerald-900 bg-emerald-50 border-emerald-200',
      badge: 'ENV CONFIGURED'
    },
    'process.env': {
      label: 'Environment Variable · process.env fallback',
      color: 'text-emerald-900 bg-emerald-50 border-emerald-200',
      badge: 'NODE ENV'
    },
    'localStorage.user': {
      label: 'User-Provided · stored locally in this browser (on device only)',
      color: 'text-brand-900 bg-brand-50 border-brand-200',
      badge: 'USER KEY'
    },
    'none': {
      label: 'No key configured · analysis pipeline will display a configuration error when Run is clicked.',
      color: 'text-rose-900 bg-rose-50 border-rose-200',
      badge: 'NOT CONFIGURED'
    }
  };

  const sourceInfo = sourceLabelMap[activeSource];

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

      <div className="bg-surface border border-gray-200/80 rounded-2xl p-5 shadow-sm flex flex-col gap-4 max-w-2xl">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-gray-900" />
          <h3 className="font-bold text-sm text-gray-900">Gemini AI · API Key Configuration</h3>
          <span className={`ml-auto text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${sourceInfo.color}`}>
            {sourceInfo.badge}
          </span>
        </div>

        <div className={`rounded-xl p-3.5 border text-[11px] flex items-start gap-2 ${sourceInfo.color}`}>
          {activeSource === 'none' ? (
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex flex-col gap-0.5">
            <span className="font-bold">{sourceInfo.label}</span>
            {activeSource !== 'import.meta.env' && activeSource !== 'none' && (
              <span className="text-[10px] opacity-80">Priority order: import.meta.env → process.env → user-provided key.</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="user-api-key-input" className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider flex items-center gap-1">
            <KeyRound className="w-3 h-3 text-gray-400" />
            <span>User-Provided Gemini API Key (Optional Override)</span>
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                id="user-api-key-input"
                type={revealKey ? 'text' : 'password'}
                value={userApiKey}
                onChange={(e) => setUserApiKey(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder="Paste AIza... or GEMINI key here to enable pipeline without .env file"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 pr-9 text-xs outline-none input-focus font-semibold font-mono tracking-tight"
              />
              <button
                type="button"
                onClick={() => setRevealKey((r) => !r)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors p-1"
                title={revealKey ? 'Hide key' : 'Reveal key'}
              >
                {revealKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <button
              type="button"
              onClick={handleSaveUserKey}
              disabled={saveStatus !== 'idle' && saveStatus !== 'removed'}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-gradient text-white hover:opacity-95 transition-opacity shadow-md shadow-brand-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saveStatus === 'saved' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClearUserKey}
              disabled={!userApiKey.trim()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Remove user-provided key"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          </div>
          {saveStatus === 'removed' && (
            <p className="text-[10px] font-bold text-gray-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              User-provided key cleared. Refresh the page to fall back to environment keys.
            </p>
          )}
          <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed font-medium">
            Stored strictly on-device in your browser localStorage under key <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">{storageKey}</code>.
            Reload the page after saving for the resolver to pick up the new source. A valid environment <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">VITE_GEMINI_API_KEY</code> always takes priority.
          </p>
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
                  onClick={() => { onClearSavedDocs(); setShowClearConfirm(false); }}
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
