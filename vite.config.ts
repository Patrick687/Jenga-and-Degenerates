import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Relative base so the built site works from a domain root or a sub-folder.
  base: './',
  plugins: [react(), tailwindcss()],
  // `host: true` exposes the dev server on your LAN so you can test on a phone.
  server: { host: true },
  preview: { host: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
