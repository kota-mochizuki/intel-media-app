import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

// BudouX は本体から読むと中国語・タイ語のモデルまで入るので、文節分けと日本語モデルだけを直接読む
const bx = (f: string) => fileURLToPath(new URL(`./node_modules/budoux/module/${f}`, import.meta.url));

export default defineConfig({
  base: './',
  resolve: { alias: { 'budoux-lite/parser': bx('parser.js'), 'budoux-lite/ja': bx('data/models/ja.js') } },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: '朝の5分',
        short_name: '朝の5分',
        description: '自分専用の情報メディア。毎朝5分で読める配信',
        lang: 'ja',
        start_url: './',
        display: 'standalone',
        background_color: '#faf8f4',
        theme_color: '#2b3a67',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      // アプリ本体を丸ごとキャッシュする。配信データは端末に控え（localStorage）を持つので、電波がなくても読める
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'], navigateFallback: 'index.html', globIgnores: ['demo/**'] },
    }),
  ],
  test: { environment: 'node' },
});
