import { useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import HostProfileAvatar from './HostProfileAvatar'
import ProfilePhotoCropModal from './ProfilePhotoCropModal'
import {
  IMAGE_ACCEPT,
  mediaUploadErrorMessage,
  readMediaFileAsDataUrl,
} from '../../lib/mediaUpload'

type PersonalProfilePhotoEditorProps = {
  name: string
  photoUrl: string
  onPhotoChange: (url: string) => void
  label?: string
  helperText?: string
}

export default function PersonalProfilePhotoEditor({
  name,
  photoUrl,
  onPhotoChange,
  label = 'Profile photo',
  helperText = 'Square crop â€” shown as your avatar and on your public profile.',
}: PersonalProfilePhotoEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState('')
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  async function handleFileChange(file: File | undefined) {
    if (!file) return
    setUploadError('')

    const result = await readMediaFileAsDataUrl(file)
    if ('error' in result) {
      setUploadError(mediaUploadErrorMessage(result.error))
      return
    }

    setCropSrc(result.dataUrl)
  }

  function handleCropConfirm(croppedDataUrl: string) {
    setCropSrc(null)
    onPhotoChange(croppedDataUrl)
  }

  function handleCropCancel() {
    setCropSrc(null)
  }

  const uploadHint = photoUrl.trim() ? 'Tap to change' : 'Tap to upload'

  return (
    <>
      <div className="mb-5 flex flex-col items-center">
        <div className="relative">
          <button
            type="button"
            aria-label={photoUrl.trim() ? 'Change profile photo' : 'Upload profile photo'}
            onClick={() => fileInputRef.current?.click()}
            className="group relative rounded-[14px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-page-bg,#fff)]"
          >
            <HostProfileAvatar name={name} avatarUrl={photoUrl} size="xl" />
            <span
              aria-hidden="true"
              className="absolute inset-0 flex flex-col items-center justify-center rounded-[14px] bg-brown/50 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              <Camera size={22} className="text-white" strokeWidth={2} />
              <span className="mt-1 text-[10px] font-semibold leading-none text-white">{uploadHint}</span>
            </span>
          </button>

          {photoUrl && (
            <button
              type="button"
              aria-label="Remove profile photo"
              onClick={() => onPhotoChange('')}
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

        <p className="mt-2 text-xs font-semibold text-brown-muted">{label}</p>
        {helperText && (
          <p className="mt-0.5 text-center text-[11px] text-brown-muted/80">{helperText}</p>
        )}

        {uploadError && <p className="mt-2 text-xs font-medium text-maroon">{uploadError}</p>}
      </div>

      <ProfilePhotoCropModal
        open={cropSrc != null}
        imageSrc={cropSrc ?? ''}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    </>
  )
}
