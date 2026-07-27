import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const TIME_STAMP = Date.now().toString(36);
const RAND = Math.random().toString(36).slice(2, 10);

function computeProjectFingerprint() {
  const candidates = [
    'package.json',
    'package-lock.json',
    'src/App.tsx',
    'src/main.tsx',
    'src/index.css',
    'index.html',
    'public/sw.js',
  ];
  let hasher = createHash('sha256');
  hasher.update(TIME_STAMP);
  hasher.update(RAND);
  const cwd = fileURLToPath(new URL('.', import.meta.url));
  for (const f of candidates) {
    try {
      const full = resolve(cwd, f);
      if (existsSync(full)) {
        const buf = readFileSync(full);
        hasher.update(buf);
      }
    } catch { /* ignore */ }
  }
  return hasher.digest('base64url').slice(0, 12);
}

const PROJECT_FINGERPRINT = computeProjectFingerprint();
const BUILD_ID = TIME_STAMP + '-' + PROJECT_FINGERPRINT;

export default defineConfig({
  define: {
    __APP_BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  plugins: [react()],
  base: '/',
  css: {
    devSourcemap: true,
    modules: {
      localsConvention: 'camelCaseOnly',
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    cssCodeSplit: true,
    cssMinify: true,
    minify: 'esbuild',
    target: ['es2022', 'safari15.4', 'chrome100', 'firefox100', 'edge100'],
    modulePreload: {
      polyfill: true,
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('@google/generative-ai')) return 'vendor-gemini';
            if (id.includes('tesseract.js') || id.includes('pdfjs-dist') || id.includes('mammoth')) return 'vendor-document';
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            return 'vendor-shared';
          }
          return undefined;
        },
        entryFileNames: `assets/[name]-[hash]-${PROJECT_FINGERPRINT}.js`,
        chunkFileNames: `assets/[name]-[hash]-${PROJECT_FINGERPRINT}.js`,
        assetFileNames: `assets/[name]-[hash]-${PROJECT_FINGERPRINT}.[ext]`,
        hashCharacters: 'base36',
      },
    },
  },
});
