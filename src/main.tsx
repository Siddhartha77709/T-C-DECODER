import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const EXPECTED_SW_PATH = '/sw.js';
const EXPECTED_SW_CACHE_VERSION_TOKEN = 'tanc-decoder-v6';
const REGISTRATION_KEY_MARK = `${EXPECTED_SW_CACHE_VERSION_TOKEN}:reg:ok`;
const FORCE_UNREGISTER_ALL = false;

(function globalThisPolyfill() {
  type G = typeof globalThis & { msCrypto?: Crypto };
  try {
    if (typeof globalThis === 'undefined') {
      const fallback: typeof globalThis =
        (typeof window !== 'undefined' ? (window as unknown as typeof globalThis)
        : (typeof self !== 'undefined' ? (self as unknown as typeof globalThis)
        : ({} as typeof globalThis)));
      Object.defineProperty(fallback, 'globalThis', {
        value: fallback,
        configurable: true,
        writable: true,
      });
    }
    if (typeof (globalThis as G).crypto === 'undefined' && typeof window !== 'undefined') {
      (globalThis as G).crypto = (window as G).crypto || ((window as G).msCrypto as Crypto);
    }
    if (typeof (globalThis as G).crypto?.randomUUID === 'undefined') {
      const hex = '0123456789abcdef';
      (globalThis as G).crypto!.randomUUID = () =>
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return hex[v];
        }) as `${string}-${string}-${string}-${string}-${string}`;
    }
  } catch {
    /* no-op: best-effort polyfill only */
  }
})();

(async function serviceWorkerLifecycle() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  const ua = (navigator.userAgent || '').toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|mobile safari|fban|fbav/i.test(ua);

  const report = (level: 'info' | 'warn' | 'error', msg: string, extra?: unknown) => {
    const prefix = `[SW Lifecycle${isMobile ? ' · Mobile' : ''}]`;
    if (level === 'error') console.error(prefix, msg, extra ?? '');
    else if (level === 'warn') console.warn(prefix, msg, extra ?? '');
    else console.info(prefix, msg, extra ?? '');
  };

  try {
    const allRegs = await navigator.serviceWorker.getRegistrations();
    let nukedLegacyCount = 0;

    const hardKill = FORCE_UNREGISTER_ALL || !!sessionStorage.getItem('__tanc_force_nuke_sw') || !!localStorage.getItem('__tanc_force_nuke_sw');

    for (const reg of allRegs) {
      try {
        const scope = reg.scope || '';
        if (!scope.includes(location.origin) && !scope.startsWith('/')) continue;
        const active = reg.active;
        const waiting = reg.waiting;
        const installing = reg.installing;
        const anyScriptUrl = (active?.scriptURL) || (waiting?.scriptURL) || (installing?.scriptURL) || '';
        const isExpected = anyScriptUrl.includes(EXPECTED_SW_PATH);

        const knownVersionOk =
          (!!active && active.state !== 'redundant' && (
            sessionStorage.getItem(REGISTRATION_KEY_MARK) === '1'
            || anyScriptUrl.includes(EXPECTED_SW_PATH)
          ));

        const shouldKill = hardKill || !isExpected || !knownVersionOk || isMobile;

        if (shouldKill) {
          const ok = await reg.unregister();
          if (ok) nukedLegacyCount += 1;
          report(ok ? 'warn' : 'error', `${ok ? 'Unregistered' : 'Failed to unregister'} ${hardKill ? 'HARD-KILL' : (isExpected ? 'existing' : 'legacy/orphan')} SW for scope: ${scope}`, anyScriptUrl || '(no script)');
        } else {
          report('info', `Keeping registration for scope ${scope}. Calling reg.update()...`);
          try {
            await Promise.race([reg.update(), new Promise<void>((res) => setTimeout(() => res(), 5000))]);
          } catch (updateErr) {
            report('warn', `reg.update() failed or timed out (safe). Will retry on next load.`, updateErr);
          }
        }
      } catch (regErr) {
        report('error', 'Error iterating service worker registration.', regErr);
      }
    }

    if (nukedLegacyCount > 0) {
      report('warn', `Nuked ${nukedLegacyCount} stale/orphan SW registrations. Reloading page to install clean ${EXPECTED_SW_CACHE_VERSION_TOKEN}.`);
      try { caches.keys().then((keys) => Promise.all(keys.filter(k => !k.includes(EXPECTED_SW_CACHE_VERSION_TOKEN)).map(k => caches.delete(k).catch(() => false)))); } catch { /* ignore */ }
      try {
        if (sessionStorage.getItem('tanc_sw_reload_once') !== '1') {
          sessionStorage.setItem('tanc_sw_reload_once', '1');
          window.location.reload();
          return;
        }
      } catch {
        try { sessionStorage.removeItem('tanc_sw_reload_once'); } catch { /* ignore */ }
      }
    }

    let registeredNew: ServiceWorkerRegistration | undefined;
    try {
      registeredNew = await navigator.serviceWorker.register(EXPECTED_SW_PATH, {
        scope: '/',
        updateViaCache: 'none',
      });
      sessionStorage.setItem(REGISTRATION_KEY_MARK, '1');
      report('info', `Registered ${EXPECTED_SW_CACHE_VERSION_TOKEN} — scope: ${registeredNew.scope}.`);

      try {
        await Promise.race([registeredNew.update(), new Promise<void>((res) => setTimeout(() => res(), 5000))]);
      } catch (updateErr) {
        report('warn', `Post-register reg.update() failed or timed out (safe).`, updateErr);
      }

      registeredNew.addEventListener('updatefound', () => {
        report('info', `updatefound fired: ${EXPECTED_SW_CACHE_VERSION_TOKEN} new SW installing.`);
        const nw = registeredNew?.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          report('info', `new SW state → ${nw.state}`);
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            try { (registeredNew as ServiceWorkerRegistration).waiting?.postMessage({ type: 'SKIP_WAITING_PLEASE' }); } catch { /* ignore */ }
          }
          if (nw.state === 'activated' && !navigator.serviceWorker.controller) {
            try { window.location.reload(); } catch { /* ignore */ }
          }
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        report('warn', `controllerchange fired: ${EXPECTED_SW_CACHE_VERSION_TOKEN} took control.`);
      });

      window.setInterval(() => {
        try { registeredNew?.update().catch(() => undefined); } catch { /* no-op */ }
      }, 1000 * 60 * 10);

      window.addEventListener('focus', () => {
        try { registeredNew?.update().catch(() => undefined); } catch { /* no-op */ }
      }, { passive: true });

      window.addEventListener('pageshow', (e) => {
        try {
          if ((e as PageTransitionEvent).persisted) {
            report('info', 'Restored from bfcache — forcing SW update.');
            try { registeredNew?.update().catch(() => undefined); } catch { /* no-op */ }
          }
        } catch { /* ignore */ }
      }, { passive: true });
    } catch (err) {
      report('error', `Failed to register ${EXPECTED_SW_PATH}.`, err);
    }
  } catch (topErr) {
    report('error', 'Top-level SW lifecycle threw unexpectedly. Continuing to mount React anyway.', topErr);
  }
})();

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('React root element #root not found — cannot mount app.');
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
