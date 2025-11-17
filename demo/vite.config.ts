import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'safari-pinned-tab.svg'],
      manifest: {
        name: 'Kinetic Input - React Components',
        short_name: 'Kinetic Input',
        description: 'High-performance React number picker components with momentum scrolling',
        theme_color: '#3EDCFF',
        background_color: '#0A0B0D',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Get Started',
            short_name: 'Docs',
            description: 'View installation and usage guide',
            url: '/#snippets',
            icons: [{ src: '/favicon.svg', sizes: '96x96' }]
          },
          {
            name: 'Presets Gallery',
            short_name: 'Presets',
            description: 'Browse themed picker examples',
            url: '/#presets',
            icons: [{ src: '/favicon.svg', sizes: '96x96' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Force immediate activation and control of all clients
        skipWaiting: true,
        clientsClaim: true,
        // Clean old caches automatically
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tensil/kinetic-input': path.resolve(__dirname, '../packages/number-picker/src'),
      '@tensil/kinetic-input-css': path.resolve(__dirname, '../packages/number-picker/dist'),
    },
  },
  server: {
    port: 3001,
    watch: {
      // Prevent watching the package dist to avoid HMR loops
      ignored: ['**/node_modules/**', '**/packages/number-picker/dist/**'],
    },
  },
  optimizeDeps: {
    // Exclude local workspace package from pre-bundling to enable HMR
    exclude: ['@tensil/kinetic-input'],
  },
});
