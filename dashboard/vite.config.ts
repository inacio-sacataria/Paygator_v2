import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    strictPort: false,
    proxy: {
      // Proxy para rotas /admin - DEVE vir primeiro
      '/admin': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('[VITE PROXY] Proxying:', req.method, req.url, '→', 'http://127.0.0.1:3000' + req.url);
          });
          proxy.on('error', (err, _req, _res) => {
            console.error('[VITE PROXY] Error:', err);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('[VITE PROXY] Response:', proxyRes.statusCode, req.url);
          });
        },
      },
      // Proxy para rotas /api
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('[VITE PROXY] Proxying API:', req.method, req.url, '→', 'http://127.0.0.1:3000' + req.url);
          });
        },
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})

