import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Custom plugin to copy index.html to 404.html after build
function copy404Plugin() {
  return {
    name: 'copy-404',
    writeBundle() {
      const indexPath = path.resolve(__dirname, 'dist/index.html')
      const notFoundPath = path.resolve(__dirname, 'dist/404.html')
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, notFoundPath)
        console.log('✓ Copied index.html to 404.html for GitHub Pages SPA routing')
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copy404Plugin()],
  base: '/PokerCashFlow/',
  server: {
    allowedHosts: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
}) 