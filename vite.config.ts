import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/WhatToWatch/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'What To Watch',
        short_name: 'WhatToWatch',
        description: 'Household movie & TV watch tracker',
        theme_color: '#aa3bff',
        background_color: '#16171d',
        display: 'standalone',
        start_url: '/WhatToWatch/',
        scope: '/WhatToWatch/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Cache list views for offline viewing; adding/rating still needs a connection.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/image\.tmdb\.org\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tmdb-posters',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
})
