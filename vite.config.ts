import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 如果部署在 GitHub Pages（例如 https://<username>.github.io/<repo>/），
// 需要设置 base: process.env.BASE_URL || '/'
export default defineConfig({
  base: process.env.BASE_URL || '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    target: 'es2020',
    cssTarget: 'chrome90',
  },
})
