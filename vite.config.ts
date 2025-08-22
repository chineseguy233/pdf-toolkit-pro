import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@main': resolve(__dirname, 'src/main')
    }
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      input: resolve(__dirname, 'src/renderer/index.html')
    }
  },
  root: 'src/renderer',
  server: {
    port: 5176,
    host: '0.0.0.0',
    strictPort: true,
    open: false
  },
  optimizeDeps: {
    exclude: ['electron']
  }
})