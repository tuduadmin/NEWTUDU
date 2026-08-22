import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const SOURCE = path.resolve(
  String.raw`C:\Users\Kadeoilfield WS1\.cursor\projects\c-Users-Kadeoilfield-WS1-Projects-emerald-lounge\assets\c__Users_Kadeoilfield_WS1_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-3040eedf-faf3-4fea-8afd-ece4e1f91e19.png`,
)
const OUT_ASSET = path.resolve('src/assets/icons/nav-host-events.png')
const OUT_PUBLIC = path.resolve('public/icons/nav-host-events.png')
const OUT_SIZE = 256

/** Dark canvas (~#1E1B26) — only flood from edges so ticket strokes stay opaque. */
function isDarkCanvas(r, g, b, a) {
  if (a < 16) return true
  return r < 60 && g < 55 && b < 60
}

function floodBackgroundTransparent(data, width, height, channels) {
  const n = width * height
  const bg = new Uint8Array(n)
  const queue = []

  const trySeed = (x, y) => {
    const i = y * width + x
    const o = i * channels
    if (!isDarkCanvas(data[o], data[o + 1], data[o + 2], data[o + 3])) return
    bg[i] = 1
    queue.push(i)
  }

  for (let x = 0; x < width; x++) {
    trySeed(x, 0)
    trySeed(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    trySeed(0, y)
    trySeed(width - 1, y)
  }

  while (queue.length) {
    const i = queue.pop()
    const x = i % width
    const y = (i - x) / width
    const neighbors = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ]
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
      const ni = ny * width + nx
      if (bg[ni]) continue
      const o = ni * channels
      if (!isDarkCanvas(data[o], data[o + 1], data[o + 2], data[o + 3])) continue
      bg[ni] = 1
      queue.push(ni)
    }
  }

  for (let i = 0; i < n; i++) {
    if (bg[i]) data[i * channels + 3] = 0
  }
}

async function main() {
  const img = sharp(SOURCE)
  const meta = await img.metadata()
  const { width, height, channels } = meta
  if (!width || !height) throw new Error('Missing dimensions')

  const { data } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  floodBackgroundTransparent(data, width, height, channels)

  const rgba = await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer()

  const trimmed = await sharp(rgba).trim({ threshold: 1 }).png().toBuffer()

  const square = await sharp(trimmed)
    .resize(OUT_SIZE, OUT_SIZE, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()

  for (const out of [OUT_ASSET, OUT_PUBLIC]) {
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, square)
  }
  const trimmedMeta = await sharp(trimmed).metadata()
  const tw = trimmedMeta.width ?? 0
  const th = trimmedMeta.height ?? 0
  console.log('wrote', OUT_ASSET, OUT_PUBLIC, `${OUT_SIZE}x${OUT_SIZE}`, `(trimmed ${tw}x${th})`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
