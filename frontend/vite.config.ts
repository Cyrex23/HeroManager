import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: false,          // don't bind to all network interfaces
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    },
    watch: {
      usePolling: false,  // use native FS events, not CPU-burning polling
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/*.java',
        '**/backend/**',
      ],
    },
  },
  optimizeDeps: {
    force: false,         // don't re-bundle deps on every cold start
  },
})
