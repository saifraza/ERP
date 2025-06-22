import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: [
      'frontend-production-adfe.up.railway.app',
      '.up.railway.app',
      'localhost'
    ]
  }
})
