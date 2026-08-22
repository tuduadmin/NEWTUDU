import { useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import HostProfileAvatar from './HostProfileAvatar'
import {
  IMAGE_ACCEPT,
  mediaUploadErrorMessage,
  readMediaFileAsDataUrl,
} from '../../lib/mediaUpload'

type HostProfileAvatarEditorProps = {
  name: string
  avatarUrl: string
  onAvatarUrlChange: (url: string) => void
  label?: string
}

export default function HostProfileAvatarEditor({
  name,
  avatarUrl,
  onAvatarUrlChange,
  label = 'Profile photo',
}: HostProfileAvatarEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState('')

  async function handleFileChange(file: File | undefined) {
    if (!file) return
    setUploadError('')

    const result = await readMediaFileAsDataUrl(file)
    if ('error' in result) {
      setUploadError(mediaUploadErrorMessage(result.error))
      return
    }

    onAvatarUrlChange(result.dataUrl)
  }

  const uploadHint = avatarUrl.trim() ? 'Tap to change' : 'Tap to upload'

  return (
    <div className="mb-5 flex flex-col items-center">
      <div className="relative">
        <button
          type="button"
          aria-label={avatarUrl.trim() ? 'Change photo' : 'Upload photo'}
          onClick={() => fileInputRef.current?.click()}
          className="group relative rounded-[14px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-page-bg,#fff)]"
        >
          <HostProfileAvatar name={name} avatarUrl={avatarUrl} size="xl" />
          <span
            aria-hidden="true"
            className="absolute inset-0 flex flex-col items-center justify-center rounded-[14px] bg-brown/50 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            <Camera size={22} className="text-white" strokeWidth={2} />
            <span className="mt-1 text-[10px] font-semibold leading-none text-white">{uploadHint}</span>
          </span>
        </button>

        {avatarUrl && (
          <button
            type="button"
            aria-label="Remove photo"
            onClick={() => onAvatarUrlChange('')}
            className="absolute -right-1 -top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-app-subtle bg-app-elevated text-brown-muted shadow-sm transition hover:border-orange/30 hover:text-brown"
          >
            <X size={14} />
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          className="hidden"
          onChange={(e) => {
            void handleFileChange(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      {label ? <p className="mt-2 text-xs font-semibold text-brown-muted">{label}</p> : null}

      {uploadError && <p className="mt-2 text-xs font-medium text-maroon">{uploadError}</p>}
    </div>
  )
}
