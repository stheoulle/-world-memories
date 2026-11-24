import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Served from the root of a custom domain (GitHub Pages + Cloudflare DNS).
export default defineConfig({
  base: '/',
  plugins: [react()],
})
