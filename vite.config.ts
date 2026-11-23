import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Served from https://<user>.github.io/world-memories/ on GitHub Pages.
export default defineConfig({
  base: '/world-memories/',
  plugins: [react()],
})
