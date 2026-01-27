import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/mwd-wins-api-explorer/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/wins': {
        target: 'https://webservices.mwdsc.org',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
