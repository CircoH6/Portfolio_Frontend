import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // 0.0.0.0 : nécessaire en conteneur / prévisualisation distante.
    // Désactivable localement via VITE_DEV_HOST=127.0.0.1.
    host: process.env.VITE_DEV_HOST || true,
    port: 5173,
    strictPort: false,
    // Hôtes autorisés (protection DNS rebinding). `.e2b.app` couvre les
    // tunnels de prévisualisation ; à compléter via VITE_DEV_ALLOWED_HOSTS.
    allowedHosts: process.env.VITE_DEV_ALLOWED_HOSTS
      ? process.env.VITE_DEV_ALLOWED_HOSTS.split(',')
      : ['.e2b.app'],
  },
  preview: {
    host: process.env.VITE_DEV_HOST || true,
    port: 4173,
    allowedHosts: process.env.VITE_DEV_ALLOWED_HOSTS
      ? process.env.VITE_DEV_ALLOWED_HOSTS.split(',')
      : ['.e2b.app'],
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.spec.js'],
    restoreMocks: true,
  },
})
