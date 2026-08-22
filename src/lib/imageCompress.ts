export const MAX_IMAGE_DIMENSION = 1200
export const JPEG_QUALITY = 0.8
export const MAX_COMPRESSED_IMAGE_BYTES = 400 * 1024
export const GALLERY_SIZE_WARN_BYTES = 4 * 1024 * 1024

export const PROFILE_STORAGE_QUOTA_MESSAGE =
  'Your photos are too large to store in this demo. Try fewer photos or smaller images. (Tip: we compressed uploads automatically — remove a photo and re-add if this persists.)'

export const IMAGE_STILL_TOO_LARGE_MESSAGE =
  'This photo is still too large after compression. Try a smaller image or a different photo.'

export class ImageCompressError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageCompressError'
  }
}

/** Approximate decoded byte size of a base64 data URL. */
export function estimateDataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',')
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
  return Math.ceil((base64.length * 3) / 4)
}

export function estimateGalleryBytes(photos: string[]): number {
  return photos.reduce((sum, photo) => sum + estimateDataUrlBytes(photo), 0)
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new ImageCompressError('Could not read image.'))
    }
    img.src = url
  })
}

/**
 * Resize and compress an image file to a JPEG data URL suitable for localStorage.
 * Max longest edge 1200px, quality ~0.8, target <= ~400KB.
 */
export async function compressImageFile(file: File): Promise<string> {
  const img = await loadImageFromFile(file)
  const { width, height } = img
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, height))
  const targetW = Math.max(1, Math.round(width * scale))
  const targetH = Math.max(1, Math.round(height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new ImageCompressError('Could not process image.')
  }

  ctx.drawImage(img, 0, 0, targetW, targetH)

  let quality = JPEG_QUALITY
  let dataUrl = canvas.toDataURL('image/jpeg', quality)
  let bytes = estimateDataUrlBytes(dataUrl)

  while (bytes > MAX_COMPRESSED_IMAGE_BYTES && quality > 0.45) {
    quality -= 0.1
    dataUrl = canvas.toDataURL('image/jpeg', quality)
    bytes = estimateDataUrlBytes(dataUrl)
  }

  if (bytes > MAX_COMPRESSED_IMAGE_BYTES) {
    throw new ImageCompressError(IMAGE_STILL_TOO_LARGE_MESSAGE)
  }

  return dataUrl
}

/** Compress an existing canvas to a JPEG data URL within size limits. */
export function compressCanvasToDataUrl(
  canvas: HTMLCanvasElement,
  maxBytes = MAX_COMPRESSED_IMAGE_BYTES,
): string {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new ImageCompressError('Could not process image.')
  }

  let quality = JPEG_QUALITY
  let dataUrl = canvas.toDataURL('image/jpeg', quality)
  let bytes = estimateDataUrlBytes(dataUrl)

  while (bytes > maxBytes && quality > 0.45) {
    quality -= 0.1
    dataUrl = canvas.toDataURL('image/jpeg', quality)
    bytes = estimateDataUrlBytes(dataUrl)
  }

  if (bytes > maxBytes) {
    throw new ImageCompressError(IMAGE_STILL_TOO_LARGE_MESSAGE)
  }

  return dataUrl
}

const CROP_OUTPUT_SIZE = 800

/**
 * Crop a square region from a loaded image (source coords) and return compressed JPEG data URL.
 */
export function cropSquareToDataUrl(
  img: HTMLImageElement,
  srcX: number,
  srcY: number,
  srcSize: number,
): string {
  const canvas = document.createElement('canvas')
  canvas.width = CROP_OUTPUT_SIZE
  canvas.height = CROP_OUTPUT_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new ImageCompressError('Could not process image.')
  }

  ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, CROP_OUTPUT_SIZE, CROP_OUTPUT_SIZE)
  return compressCanvasToDataUrl(canvas)
}

export function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new ImageCompressError('Could not read image.'))
    img.src = dataUrl
  })
}
