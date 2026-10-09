import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

const CONFIG_REL = 'public/config/mode-heroes.json'

type HeroMode = 'road-trip' | 'bucket-list'

const LIVE_BASENAME: Record<HeroMode, string> = {
  'road-trip': 'road-trip-hero-live',
  'bucket-list': 'bucket-list-hero-live',
}

function readRawBody(req: import('http').IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function readJsonBody(
  req: import('http').IncomingMessage,
): Promise<{ mode?: HeroMode; clear?: boolean }> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(body) as { mode?: HeroMode; clear?: boolean })
      } catch {
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

function readConfig(root: string): Record<string, unknown> {
  const configPath = path.join(root, CONFIG_REL)
  if (!fs.existsSync(configPath)) return {}
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8')) as Record<string, unknown>
  } catch {
    return {}
  }
}

function writeModeConfig(
  root: string,
  mode: HeroMode,
  heroRel: string,
  label?: string,
) {
  const configPath = path.join(root, CONFIG_REL)
  const updatedAt = new Date().toISOString()
  const next = readConfig(root)
  next[mode] = {
    heroImageUrl: heroRel,
    label: label?.trim() || undefined,
    updatedAt,
  }
  fs.mkdirSync(path.dirname(configPath), { recursive: true })
  fs.writeFileSync(configPath, `${JSON.stringify(next, null, 2)}\n`)
  return next[mode]
}

function clearModeHero(root: string, mode: HeroMode) {
  const configPath = path.join(root, CONFIG_REL)
  const themesDir = path.join(root, 'public/themes')
  const next = readConfig(root)
  delete next[mode]
  fs.mkdirSync(path.dirname(configPath), { recursive: true })
  fs.writeFileSync(configPath, `${JSON.stringify(next, null, 2)}\n`)
  const base = LIVE_BASENAME[mode]
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    const file = path.join(themesDir, `${base}.${ext}`)
    if (fs.existsSync(file)) fs.unlinkSync(file)
  }
}

function parseMode(raw: string | string[] | undefined): HeroMode | null {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (value === 'road-trip' || value === 'bucket-list') return value
  return null
}

function handlePublish(
  root: string,
  mode: HeroMode,
  buffer: Buffer,
  ext: string,
  label?: string,
) {
  const themesDir = path.join(root, 'public/themes')
  const base = LIVE_BASENAME[mode]
  fs.mkdirSync(themesDir, { recursive: true })
  for (const oldExt of ['jpg', 'jpeg', 'png', 'webp']) {
    const oldFile = path.join(themesDir, `${base}.${oldExt}`)
    if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile)
  }
  const heroRel = `/themes/${base}.${ext}`
  fs.writeFileSync(path.join(root, 'public', heroRel.slice(1)), buffer)
  return writeModeConfig(root, mode, heroRel, label)
}

export function modeHeroDevApi(): Plugin {
  return {
    name: 'mode-hero-dev-api',
    configureServer(server) {
      const handler = (req: import('http').IncomingMessage, res: import('http').ServerResponse) => {
        void (async () => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.end('Method not allowed')
            return
          }

          const root = process.cwd()
          const contentType = req.headers['content-type'] ?? ''

          try {
            if (contentType.includes('application/json')) {
              const body = await readJsonBody(req)
              const mode = body.mode
              if (!mode) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Missing mode' }))
                return
              }
              if (body.clear) {
                clearModeHero(root, mode)
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ cleared: true, mode }))
                return
              }
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Use image upload for publish.' }))
              return
            }

            if (
              contentType.includes('application/octet-stream') ||
              contentType.startsWith('image/')
            ) {
              const mode = parseMode(req.headers['x-hero-mode'])
              if (!mode) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Missing X-Hero-Mode header' }))
                return
              }

              const buffer = await readRawBody(req)
              if (buffer.length === 0) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Empty image body' }))
                return
              }

              let ext = 'jpg'
              if (contentType.includes('png')) ext = 'png'
              else if (contentType.includes('webp')) ext = 'webp'

              const labelHeader = req.headers['x-hero-label']
              const label =
                typeof labelHeader === 'string' ? decodeURIComponent(labelHeader) : undefined

              const config = handlePublish(root, mode, buffer, ext, label)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(config))
              return
            }

            res.statusCode = 415
            res.end(JSON.stringify({ error: 'Unsupported content type' }))
          } catch (err) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Publish failed' }))
          }
        })()
      }

      server.middlewares.use('/api/dev/mode-hero', handler)
      server.middlewares.use('/api/dev/road-trip-hero', (req, res) => {
        if (req.headers['x-hero-mode']) {
          handler(req, res)
          return
        }
        req.headers['x-hero-mode'] = 'road-trip'
        handler(req, res)
      })
    },
  }
}
