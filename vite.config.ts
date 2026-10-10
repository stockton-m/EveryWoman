import path from 'path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { seoPlugins } from './scripts/seo/plugin.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), ...seoPlugins()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
