import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt': a new version waits until the user chooses to reload (or the app
      // is next cold-started) instead of swapping code under a running session.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: [
        'favicon.ico',
        'favicon.svg',
        'apple-touch-icon.png',
        'mask-icon.svg',
        'theme-init.js',
      ],
      manifest: {
        id: '/',
        name: 'ClockWise',
        short_name: 'ClockWise',
        description: 'Pomodoro focus timer + project time-tracker + analytics',
        lang: 'en',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'any',
        scope: '/',
        start_url: '/timer',
        categories: ['productivity'],
        icons: [
          { src: '/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/monochrome-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'monochrome',
          },
        ],
      },
      workbox: {
        // Precache fonts too, so an offline launch still has its typography.
        globPatterns: ['**/*.{js,css,html,woff2,svg,ico}', 'pwa-*.png', 'apple-touch-icon.png'],
        // Non-Latin subsets are only fetched (online) when such text appears; don't
        // make every install download them.
        globIgnores: ['**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2'],
        // Control the very first page load too, so going offline in the first
        // session still works. Updates still wait for the user (registerType: prompt).
        clientsClaim: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/__\/.*/, /\.[a-z0-9]+$/i],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/splash/'),
            handler: 'CacheFirst',
            options: { cacheName: 'splash', expiration: { maxEntries: 20 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Recharts is only needed by the stats pages, so let Rollup keep it in
        // their lazy chunks instead of preloading it on first visit.
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'zustand'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
});
