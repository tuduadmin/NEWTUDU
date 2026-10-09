import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

const CONFIG_REL = 'public/config/road-trip-hero.json'
const HERO_BASENAME = 'road-trip-hero-live'

function readRawBody(req: import('http').IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function readJsonBody(req: import('http').IncomingMessage): Promise<{ label?: string; clear?: boolean }> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(body) as { label?: string; clear?: boolean })
      } catch {
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

function writeConfig(root: string, heroRel: string, label?: string) {
  const configPath = path.join(root, CONFIG_REL)
  const updatedAt = new Date().toISOString()
  const config = {
    heroImageUrl: heroRel,
    label: label?.trim() || undefined,
    updatedAt,
  }
  fs.mkdirSync(path.dirname(configPath), { recursive: true })
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`)
  return config
}

function clearPublishedHero(root: string) {
  const configPath = path.join(root, CONFIG_REL)
  const themesDir = path.join(root, 'public/themes')
  fs.mkdirSync(path.dirname(configPath), { recursive: true })
  fs.writeFileSync(configPath, '{}\n')
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    const file = path.join(themesDir, `${HERO_BASENAME}.${ext}`)
    if (fs.existsSync(file)) fs.unlinkSync(file)
  }
}

/** Dev-only: write hero file + config so phone + desktop share the same image over LAN IP. */
export function roadTripHeroDevApi(): Plugin {
  return {
    name: 'road-trip-hero-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/dev/road-trip-hero', (req, res) => {
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
              if (body.clear) {
                clearPublishedHero(root)
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ cleared: true }))
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
              const buffer = await readRawBody(req)
              if (buffer.length === 0) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Empty image body' }))
                return
              }

              let ext = 'jpg'
              if (contentType.includes('png')) ext = 'png'
              else if (contentType.includes('webp')) ext = 'webp'
              else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg'

              const labelHeader = req.headers['x-hero-label']
              const label =
                typeof labelHeader === 'string' ? decodeURIComponent(labelHeader) : undefined

              const themesDir = path.join(root, 'public/themes')
              fs.mkdirSync(themesDir, { recursive: true })

              for (const oldExt of ['jpg', 'jpeg', 'png', 'webp']) {
                const oldFile = path.join(themesDir, `${HERO_BASENAME}.${oldExt}`)
                if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile)
              }

              const heroRel = `/themes/${HERO_BASENAME}.${ext}`
              fs.writeFileSync(path.join(root, 'public', heroRel.slice(1)), buffer)

              const config = writeConfig(root, heroRel, label)
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
      })
    },
  }
}
