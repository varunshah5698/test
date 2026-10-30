// Minimal static file server.
//
// This site is pure HTML/CSS/JS with no build step, so nothing here is needed to
// *host* the files — a Render Static Site would serve them straight from a CDN.
// It exists only because the Render service is a Web Service, and a Web Service
// must run a process that binds 0.0.0.0 on $PORT.
//
// Deliberately dependency-free: uses only node: built-ins, so `yarn install`
// has nothing to fetch and cold starts stay fast.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve, sep } from 'node:path'

const ROOT = resolve(process.cwd())
const PORT = Number(process.env.PORT ?? 10000)
const HOST = process.env.HOST ?? '0.0.0.0'

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

// Fingerprints are not in the filenames here, so HTML must revalidate while
// fonts and images can be cached for a long time.
function cacheHeader(ext) {
  if (ext === '.html') return 'no-cache'
  if (['.woff2', '.woff', '.jpg', '.jpeg', '.png', '.webp', '.svg', '.ico'].includes(ext)) {
    return 'public, max-age=86400'
  }
  return 'public, max-age=3600'
}

async function sendFile(res, file, method) {
  const ext = extname(file).toLowerCase()
  const body = await readFile(file)
  res.writeHead(200, {
    'Content-Type': TYPES[ext] ?? 'application/octet-stream',
    'Content-Length': body.length,
    'Cache-Control': cacheHeader(ext),
  })
  res.end(method === 'HEAD' ? undefined : body)
}

const server = createServer(async (req, res) => {
  const method = req.method ?? 'GET'
  if (method !== 'GET' && method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' })
    return res.end('Method not allowed')
  }

  let pathname
  try {
    pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname)
  } catch {
    res.writeHead(400)
    return res.end('Bad request')
  }

  // Directory requests serve index.html; a missing extension falls back to it so
  // in-page anchors and extensionless links keep working.
  const candidates = []
  const target = normalize(pathname).replace(/^([/\\])+/, '')
  candidates.push(target === '' || target.endsWith('/') ? `${target}index.html` : target)
  if (!extname(target)) candidates.push(`${target}/index.html`, 'index.html')

  for (const candidate of candidates) {
    const file = join(ROOT, candidate)
    // Never serve anything outside the repository root.
    if (file !== ROOT && !file.startsWith(ROOT + sep)) continue
    try {
      const info = await stat(file)
      if (info.isFile()) return await sendFile(res, file, method)
    } catch {
      // try the next candidate
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end('Not found')
})

server.listen(PORT, HOST, () => {
  console.log(`static server listening on http://${HOST}:${PORT} (root: ${ROOT})`)
})
