import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

const backendTarget = process.env.VITE_BACKEND_TARGET || 'http://localhost:8080';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare()],
  define: {
    global: 'window',
    'process.env': {},
  },
  server: {
    proxy: {
      '/ws': {
        target: backendTarget,
        changeOrigin: true,
        ws: true
      },
      '/api': {
        target: backendTarget,
        changeOrigin: true
      },
      '/uploads': {
        target: backendTarget,
        changeOrigin: true
      },
      '/oauth2': {
        target: backendTarget,
        changeOrigin: true
      },
      '/login/oauth2': {
        target: backendTarget,
        changeOrigin: true
      }
    }
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        }
      }
    }
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
})
