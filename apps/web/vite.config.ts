import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In Docker, the API is another service — not localhost inside the frontend container.
// Set VITE_API_PROXY_TARGET=http://backend:8000 for docker-compose (see docker/docker-compose.yml).
// Browsers should use VITE_API_URL=http://localhost:8000/api so calls hit the host; if unset, /api uses this proxy.
const apiProxyTarget =
  process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
})
