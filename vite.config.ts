import path from 'path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { experimentalContentPlugin } from './scripts/experimental/plugin.ts'
import { seoPlugins } from './scripts/seo/plugin.ts'

const includeExperimentalContent = process.env.INCLUDE_EXPERIMENTAL_CONTENT === 'true'

export default defineConfig({
  plugins: [
    experimentalContentPlugin({ include: includeExperimentalContent }),
    react(),
    tailwindcss(),
    ...seoPlugins(),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
