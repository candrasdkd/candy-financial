/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      includeAssets: ['apple-touch-icon.png', 'logo.png'],
      devOptions: {
        enabled: true,
        type: 'module'
      },
      manifest: {
        name: 'CandyNest',
        short_name: 'CandyNest',
        description: 'Manajemen Keluarga — Keuangan, Dokumen & Lebih',
        theme_color: '#1a2e1a',
        background_color: '#ffffff',
        lang: 'id',
        dir: 'ltr',
        orientation: 'portrait-primary',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'browser'],
        start_url: '/?source=pwa',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ],
        screenshots: [
          {
            src: 'screenshot1.png',
            sizes: '1024x1024',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Dashboard Keuangan Keluarga'
          },
          {
            src: 'screenshot2.png',
            sizes: '1024x1024',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Manajemen Transaksi Keluarga'
          },
          {
            src: 'screenshot3.png',
            sizes: '1024x1024',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Manajemen Dokumen Penting'
          }
        ],
        shortcuts: [
          {
            name: 'Catat Transaksi',
            short_name: 'Transaksi',
            description: 'Catat pengeluaran atau pemasukan baru',
            url: '/transactions?action=new',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Upload Dokumen',
            short_name: 'Upload',
            description: 'Unggah atau scan dokumen baru',
            url: '/documents?action=upload',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          }
        ],
        share_target: {
          action: '/documents?action=upload',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
            files: [
              {
                name: 'file',
                accept: ['image/*', 'application/pdf']
              }
            ]
          }
        }
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      }
    })
  ],
  build: {
    sourcemap: false,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
})
