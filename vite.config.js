import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^html2canvas$/, replacement: 'src/lib/empty.js' },
      { find: /^html2canvas\/dist\/html2canvas\.esm\.js$/, replacement: 'src/lib/empty.js' },
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          xlsx: ['xlsx'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
})