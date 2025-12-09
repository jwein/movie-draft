import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Update this to match your GitHub repo name (e.g., '/movie-draft-app/' or '/Movie-Draft/')
  // Leave as '/' if deploying to username.github.io (root domain)
  base: process.env.GITHUB_PAGES ? (process.env.REPO_NAME || '/Movie-Draft/') : '/',
  server: {
    allowedHosts: ['moviedraft.loca.lt', '.loca.lt'],
  },
})
