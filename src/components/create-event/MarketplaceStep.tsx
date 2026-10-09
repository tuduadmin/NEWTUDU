import { ImagePlus, Package, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { HostEventFormData } from '../../lib/account'
import {
  MERCH_SIZES,
  formatMerchMoney,
  sortMerchSizes,
  type EventMerchDraftProduct,
  type MerchProductFulfillment,
  type MerchSize,
} from '../../lib/eventMerch'
import { compressImageFile, ImageCompressError } from '../../lib/imageCompress'
import { IMAGE_ACCEPT } from '../../lib/mediaUpload'
import MerchFeeModePicker from '../merch/MerchFeeModePicker'
import {
  estimateMerchHostNetPerItem,
  previewMerchSingleItemCheckout,
} from '../../lib/merchPricing'
import { FieldHelper, FieldLabel, TextInput } from './CreateEventLayout'

function parsePriceCents(raw: string): number | null {
  const priceCents = Math.round(parseFloat(raw) * 100)
  if (!Number.isFinite(priceCents) || priceCents < 0) return null
  return priceCents
}

type MarketplaceStepProps = {
  form: HostEventFormData
  updateForm: (partial: Partial<HostEventFormData>) => void
}

function newDraftId(): string {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default function MarketplaceStep({ form, updateForm }: MarketplaceStepProps) {
  const enabled = form.marketplaceEnabled
  const products = form.marketplaceDraftProducts

  const [name, setName] = useState('')
  const [price, setPrice] = useState('25')
  const [imageUrl, setImageUrl] = useState('')
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)
  const [imageCompressing, setImageCompressing] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [sizes, setSizes] = useState<MerchSize[]>(['S', 'M', 'L', 'XL'])
  const [sizeStock, setSizeStock] = useState<Partial<Record<MerchSize, number>>>({
    S: 10,
    M: 10,
    L: 10,
    XL: 10,
  })
  const [fulfillment, setFulfillment] = useState<MerchProductFulfillment>('event_pickup')
  const feeMode = form.marketplaceFeeMode
  const pricePreviewCents = parsePriceCents(price)
  const singleItemPreview =
    pricePreviewCents != null
      ? previewMerchSingleItemCheckout(pricePreviewCents, feeMode)
      : null

  function toggleEnabled(next: boolean) {
    updateForm({ marketplaceEnabled: next })
  }

  function removeProduct(id: string) {
    updateForm({
      marketplaceDraftProducts: products.filter((p) => p.id !== id),
    })
  }

  function toggleSize(size: MerchSize) {
    setSizes((prev) => {
      if (prev.includes(size)) {
        setSizeStock((stock) => {
          const next = { ...stock }
          delete next[size]
          return next
        })
        return prev.filter((s) => s !== size)
      }
      setSizeStock((stock) => ({ ...stock, [size]: stock[size] ?? 10 }))
      return [...prev, size]
    })
  }

  function setSizeQuantity(size: MerchSize, value: string) {
    const parsed = parseInt(value, 10)
    setSizeStock((stock) => ({
      ...stock,
      [size]: Number.isFinite(parsed) && parsed >= 0 ? parsed : 0,
    }))
  }

  function handleAddProduct() {
    if (!name.trim()) {
      setAddError('Enter a product name.')
      return
    }
    if (sizes.length === 0) {
      setAddError('Choose at least one size.')
      return
    }
    if (sizes.some((size) => (sizeStock[size] ?? 0) < 1)) {
      setAddError('Enter at least 1 available for each selected size.')
      return
    }
    const priceCents = Math.round(parseFloat(price) * 100)
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      setAddError('Enter a valid price.')
      return
    }

    const draft: EventMerchDraftProduct = {
      id: newDraftId(),
      name: name.trim(),
      priceCents,
      sizes: sortMerchSizes([...sizes]),
      sizeStock: { ...sizeStock },
      fulfillment,
      imageUrl: imageUrl.trim() || undefined,
    }

    updateForm({ marketplaceDraftProducts: [...products, draft] })
    setName('')
    setPrice('25')
    setImageUrl('')
    setImageUploadError(null)
    setAddError(null)
    setSizes(['S', 'M', 'L', 'XL'])
    setSizeStock({ S: 10, M: 10, L: 10, XL: 10 })
    setFulfillment('event_pickup')
  }

  async function handleImageUpload(file: File | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setImageUploadError('Please choose an image file.')
      return
    }

    setImageCompressing(true)
    setImageUploadError(null)
    try {
      const dataUrl = await compressImageFile(file)
      setImageUrl(dataUrl)
    } catch (err) {
      setImageUploadError(
        err instanceof ImageCompressError ? err.message : 'Could not process image. Try again.',
      )
    } finally {
      setImageCompressing(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[14px] border border-app-subtle bg-cream-dark p-4">
        <div className="flex items-start gap-3">
          <Package className="mt-0.5 h-5 w-5 shrink-0 text-brown-muted" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-brown">Event marketplace</p>
            <p className="mt-1 text-sm text-brown-muted">
              Optional — sell merch with this event. You can add more products anytime in Event
              Manager after you publish.
            </p>
          </div>
        </div>

        <label className="mt-4 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => toggleEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-app-subtle"
          />
          <span className="text-sm font-semibold text-brown">Sell merch for this event</span>
        </label>
      </div>

      {enabled && (
        <>
          <div className="rounded-[14px] border border-app-subtle bg-cream-dark p-4">
            <MerchFeeModePicker
              value={feeMode}
              onChange={(marketplaceFeeMode) => updateForm({ marketplaceFeeMode })}
            />
          </div>

          {products.length > 0 && (
            <ul className="space-y-2">
              {products.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-[14px] border border-app-subtle bg-cream-dark px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-brown">{p.name}</p>
                    <p className="text-xs text-brown-muted">
                      {formatMerchMoney(p.priceCents)} · {sortMerchSizes(p.sizes).join(', ')} ·{' '}
                      {p.fulfillment === 'ship_ahead' ? 'Ship ahead' : 'Pickup at event'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProduct(p.id)}
                    className="shrink-0 rounded-lg p-2 text-maroon hover:bg-maroon/10"
                    aria-label={`Remove ${p.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-[14px] border border-app-subtle bg-cream-dark p-4 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wide text-brown-muted">Add product</p>

            <div>
              <FieldLabel>Product name</FieldLabel>
              <TextInput value={name} onChange={setName} placeholder="T-shirt" />
            </div>

            <div>
              <FieldLabel>Price (CAD)</FieldLabel>
              <TextInput value={price} onChange={setPrice} placeholder="25.00" />
              {singleItemPreview && pricePreviewCents != null && (
                <p className="mt-2 text-xs text-brown-muted">
                  {feeMode === 'fees_on_top' ? (
                    <>
                      Buyer pays about{' '}
                      <span className="font-semibold text-brown">
                        {formatMerchMoney(singleItemPreview.totalCents)}
                      </span>{' '}
                      at checkout (list + TUDU + Stripe).
                    </>
                  ) : (
                    <>
                      Buyer pays{' '}
                      <span className="font-semibold text-brown">
                        {formatMerchMoney(pricePreviewCents)}
                      </span>
                      . You keep about{' '}
                      <span className="font-semibold text-brown">
                        {formatMerchMoney(estimateMerchHostNetPerItem(pricePreviewCents, feeMode))}
                      </span>{' '}
                      per item after fees.
                    </>
                  )}
                </p>
              )}
            </div>

            <div>
              <FieldLabel>Sizes & stock</FieldLabel>
              <FieldHelper>Tap sizes to include; set quantity per size.</FieldHelper>
              <div className="mt-2 flex flex-wrap gap-2">
                {MERCH_SIZES.map((size) => {
                  const selected = sizes.includes(size)
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        selected
                          ? 'bg-brown text-cream'
                          : 'border border-app-subtle bg-cream-dark text-brown-muted'
                      }`}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
              {sizes.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {sortMerchSizes(sizes).map((size) => (
                    <label key={size} className="text-xs font-semibold text-brown-muted">
                      {size}
                      <TextInput
                        className="mt-1"
                        value={String(sizeStock[size] ?? 0)}
                        onChange={(v) => setSizeQuantity(size, v)}
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <FieldLabel>Fulfillment</FieldLabel>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                {(
                  [
                    { id: 'event_pickup' as const, label: 'Pickup at event' },
                    { id: 'ship_ahead' as const, label: 'Ship before event' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFulfillment(opt.id)}
                    className={`flex-1 rounded-[12px] border px-3 py-2 text-left text-sm font-semibold ${
                      fulfillment === opt.id
                        ? 'border-success-deep bg-success/10 text-brown'
                        : 'border-app-subtle bg-cream-dark text-brown-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Photo (optional)</FieldLabel>
              <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-[12px] border border-dashed border-app-subtle px-3 py-3 text-sm text-brown-muted hover:bg-cream-dark">
                <ImagePlus className="h-4 w-4 shrink-0" />
                {imageCompressing ? 'Processing…' : imageUrl ? 'Change image' : 'Upload image'}
                <input
                  type="file"
                  accept={IMAGE_ACCEPT}
                  className="sr-only"
                  disabled={imageCompressing}
                  onChange={(e) => void handleImageUpload(e.target.files?.[0] ?? null)}
                />
              </label>
              {imageUploadError && <p className="mt-1 text-xs font-semibold text-maroon">{imageUploadError}</p>}
            </div>

            {addError && <p className="text-sm font-semibold text-maroon">{addError}</p>}

            <button
              type="button"
              onClick={handleAddProduct}
              className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-app-subtle bg-cream-dark py-3 text-sm font-bold text-brown"
            >
              <Plus className="h-4 w-4" />
              Add to list
            </button>
          </div>
        </>
      )}
    </div>
  )
}
