import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Electron production builds load index.html through file://. Relative asset
  // URLs keep bundled scripts, styles, images, fonts, and models inside the app.
  base: './',
  plugins: [react()],
})
