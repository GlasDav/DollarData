import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Code splitting and optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query': ['@tanstack/react-query'],
          'charts': ['recharts'],
          'ui': ['@headlessui/react', 'framer-motion', 'lucide-react'],
        },
      },
    },
    // Warn on large chunks
    chunkSizeWarningLimit: 500, // KB
    // Minification
    minify: 'esbuild',
    sourcemap: false, // Disable sourcemaps in production for smaller size
  },
  // Optimize deps
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
