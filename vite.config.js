import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' permite publicar en GitHub Pages (subcarpeta) sin configuración extra.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
