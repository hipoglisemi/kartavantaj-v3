import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      crypto: 'crypto-browserify',
      buffer: 'buffer',
      stream: 'stream-browserify',
      events: 'events',
      util: 'util'
    },
  },
  optimizeDeps: {
    include: ['crypto-browserify', 'buffer', 'stream-browserify', 'events', 'util']
  }
})
