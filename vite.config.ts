import fs from 'node:fs'
import path from 'path'
import { defineConfig, type Plugin } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function netlify404(): Plugin {
  return {
    name: 'netlify-404',
    apply: 'build',
    writeBundle(options) {
      if (!options.dir) return
      fs.copyFileSync(
        path.join(options.dir, 'index.html'),
        path.join(options.dir, '404.html'),
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), netlify404()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
