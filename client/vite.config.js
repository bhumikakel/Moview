import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // your Express server
        changeOrigin: true,              // ensures Authorization header is preserved
        secure: false,                   // okay for local dev (not for production)
      }
    }
  }
})
