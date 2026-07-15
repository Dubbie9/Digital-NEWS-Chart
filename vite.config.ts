import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // External registration script (not inline) so the strict CSP
      // (script-src 'self') set in vercel.json keeps working
      injectRegister: 'script-defer',
      includeAssets: ['icons/*.png'],
      manifest: false, // using manual manifest in public/
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // jsPDF optional deps, only needed for jsPDF APIs this app never
      // uses — stubbed so they aren't bundled and PWA-precached
      html2canvas: path.resolve(__dirname, './src/lib/empty-module.ts'),
      dompurify: path.resolve(__dirname, './src/lib/empty-module.ts'),
      canvg: path.resolve(__dirname, './src/lib/empty-module.ts'),
    },
  },
})
