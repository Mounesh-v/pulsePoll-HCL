import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://pulsepoll-api-60e5.onrender.com',
        changeOrigin: true,
      },
      '/ws': {
        target: 'wss://pulsepoll-api-60e5.onrender.com',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
