import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const PORT = Number(process.env.ZAP_PORT || 4173)
const HOST = process.env.ZAP_HOST || '127.0.0.1'
const DIST_DIR = process.env.ZAP_DIST_DIR || 'dist'

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://chessengineapi.calmdesert-d6fcfdbe.centralus.azurecontainerapps.io",
].join('; ')

const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP,
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
}

function withSecurityHeaders(res) {
  Object.entries(SECURITY_HEADERS).forEach(([name, value]) => {
    res.setHeader(name, value)
  })
}

function resolvePath(urlPath) {
  const clean = normalize(urlPath).replace(/^\.+/, '')
  return join(DIST_DIR, clean)
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${HOST}:${PORT}`)
    const pathname = url.pathname === '/' ? '/index.html' : url.pathname
    let filePath = resolvePath(pathname)

    if (!existsSync(filePath)) {
      filePath = join(DIST_DIR, 'index.html')
    }

    const content = await readFile(filePath)
    const mime = MIME_TYPES[extname(filePath)] || 'application/octet-stream'

    withSecurityHeaders(res)
    res.statusCode = 200
    res.setHeader('Content-Type', mime)
    res.end(content)
  } catch {
    withSecurityHeaders(res)
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('Internal server error')
  }
})

server.listen(PORT, HOST, () => {
  console.log(`Secure preview running at http://${HOST}:${PORT}`)
})
