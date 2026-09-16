import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative asset paths so a production build can be served from any path
  // (including a published artifact URL) without a rewrite.
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
})
