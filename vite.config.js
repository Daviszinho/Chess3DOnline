import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BASE_CSP_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://chessengineapi.calmdesert-d6fcfdbe.centralus.azurecontainerapps.io https://cdn.jsdelivr.net https://cdnjs.cloudflare.com ws: wss:",
]

const DEV_CSP = [
  ...BASE_CSP_DIRECTIVES,
  "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
].join('; ')

const STRICT_CSP = [
  ...BASE_CSP_DIRECTIVES,
  "script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
  "style-src 'self'",
].join('; ')

function createSecurityHeaders(csp) {
  return {
    'Content-Security-Policy': csp,
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  }
}

const DEV_SECURITY_HEADERS = createSecurityHeaders(DEV_CSP)
const STRICT_SECURITY_HEADERS = createSecurityHeaders(STRICT_CSP)

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    headers: DEV_SECURITY_HEADERS,
    proxy: {
      '/api': {
        target: 'https://chessengineapi.calmdesert-d6fcfdbe.centralus.azurecontainerapps.io',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    headers: STRICT_SECURITY_HEADERS,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**/*.js'],
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
      },
    },
  },
})
