/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['apple-touch-icon.png', 'logo.png'],
      devOptions: {
        enabled: true
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
        // window-controls-overlay = judul bar lebih luas di desktop PWA
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
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Gunakan '/' sebagai fallback — '/offline' bisa infinite loop jika tidak ter-cache
        navigateFallback: '/',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          // Google Fonts CSS (stylesheet) — revalidate di background
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 tahun
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Google Fonts files (woff2, ttf, dll) — jarang berubah, cache lama
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 tahun
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Firestore REST API — NetworkFirst dengan timeout 5s, fallback ke cache
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 jam
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Firebase Storage (foto dokumen yang diupload user)
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-storage-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 hari
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // DiceBear avatars — statis per seed, aman di-cache lama
          {
            urlPattern: /^https:\/\/api\.dicebear\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'dicebear-avatars',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 hari
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
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
