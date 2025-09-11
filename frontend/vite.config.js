import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  base: './', // Important for deployment
  server: {
    proxy: {
      '/api': {
        target: 'https://rei-backend-mtcr.onrender.com',
        changeOrigin: true,
        secure: true
      }
    }
  }
})

