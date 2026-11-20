import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const apiProxy = {
  '/graphql': process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:4000',
}

export default defineConfig({
  // Absolute base: the app has a second page (/admin), and deep links must load assets from the root.
  base: '/',
  plugins: [react(), tailwindcss()],
  // `host: true` also exposes the servers on your LAN so you can test on a phone.
  // /graphql is forwarded to the backend, so the frontend and API share one origin (no CORS).
  server: { host: true, proxy: apiProxy },
  preview: { host: true, proxy: apiProxy },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
