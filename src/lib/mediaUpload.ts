export const MAX_MEDIA_BYTES = 8 * 1024 * 1024

export const IMAGE_ACCEPT = 'image/*'
export const VIDEO_ACCEPT = 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov'

export type MediaUploadError = 'too_large' | 'read_failed'

export function formatMaxMediaSize(): string {
  return '8 MB'
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('read_failed'))
    reader.readAsDataURL(file)
  })
}

export async function readMediaFileAsDataUrl(
  file: File,
  maxBytes = MAX_MEDIA_BYTES,
): Promise<{ dataUrl: string } | { error: MediaUploadError }> {
  if (file.size > maxBytes) {
    return { error: 'too_large' }
  }

  try {
    const dataUrl = await readFileAsDataUrl(file)
    return { dataUrl }
  } catch {
    return { error: 'read_failed' }
  }
}

export function mediaUploadErrorMessage(error: MediaUploadError): string {
  if (error === 'too_large') {
    return `File is too large. Max size is ${formatMaxMediaSize()}.`
  }
  return 'Could not read file. Try again.'
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name)
}
