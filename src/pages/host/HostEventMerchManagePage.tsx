import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ImagePlus, Package, Plus, Trash2, X } from 'lucide-react'
import AppHeaderBar from '../../components/locked/AppHeaderBar'
import BottomNav from '../../components/BottomNav'
import GradientButton from '../../components/GradientButton'
import { BackLink } from '../../components/NavActionButtons'
import { getHostEventById } from '../../lib/account'
import {
  MERCH_SIZES,
  buildSizeStockForSizes,
  deleteMerchProduct,
  formatMerchMoney,
  getMerchProductsForEvent,
  getMerchSizeAvailable,
  getMerchStockReport,
  saveMerchProduct,
  sortMerchSizes,
  type MerchSize,
} from '../../lib/eventMerch'
import { compressImageFile, ImageCompressError } from '../../lib/imageCompress'
import { IMAGE_ACCEPT } from '../../lib/mediaUpload'
import MerchFulfillmentPanel from '../../components/host/MerchFulfillmentPanel'

export default function HostEventMerchManagePage() {
  const { eventId = '' } = useParams<{ eventId: string }>()
  const event = eventId ? getHostEventById(eventId) : undefined
  const [refresh, setRefresh] = useState(0)

  const products = useMemo(() => {
    void refresh
    return getMerchProductsForEvent(eventId)
  }, [eventId, refresh])

  const stockReport = useMemo(() => {
    void refresh
    return getMerchStockReport(eventId)
  }, [eventId, refresh])

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

  function reload() {
    setRefresh((r) => r + 1)
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
    if (!event) {
      setAddError('Event not found.')
      return
    }
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

    const result = saveMerchProduct({
      eventId,
      hostAccountId: event.hostAccountId,
      name: name.trim(),
      priceCents,
      imageUrl: imageUrl.trim() || undefined,
      sizes,
      sizeStock: buildSizeStockForSizes(sizes, sizeStock, 10),
      active: true,
    })

    if (!result.ok) {
      setAddError(result.error)
      return
    }

    setName('')
    setPrice('25')
    setImageUrl('')
    setImageUploadError(null)
    setAddError(null)
    setSizes(['S', 'M', 'L', 'XL'])
    setSizeStock({ S: 10, M: 10, L: 10, XL: 10 })
    reload()
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

  if (!event) {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar logoLinkTo="/host" />
        <main className="px-4 pt-10 text-center text-sm text-brown-muted">Event not found.</main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar logoLinkTo="/host" />

      <main className="px-4 pt-2">
        <BackLink to="/host">Event Manager</BackLink>

        <h1 className="mt-3 font-display text-2xl font-extrabold text-brown">Event Marketplace</h1>
        <p className="mt-1 text-sm text-brown-muted">{event.title}</p>
        <p className="mt-2 text-xs text-brown-muted">
          Attendees buy tickets first, then pre-order merch. TUDU charges{' '}
          {formatMerchMoney(49)} per item. Stock the shelf using the report below.
        </p>

        <Link
          to={`/event/${eventId}/marketplace`}
          className="mt-3 inline-flex text-xs font-semibold text-orange no-underline hover:underline"
        >
          Preview buyer marketplace →
        </Link>

        <section className="mt-5 rounded-[14px] border border-app-subtle bg-app-elevated p-4">
          <h2 className="font-display text-sm font-bold text-brown">Add product</h2>
          <div className="mt-3 space-y-3">
            <input
              type="text"
              placeholder="Product name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="app-field w-full"
            />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Product image</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-[14px] border border-app-subtle bg-cream px-3 py-2 text-xs font-semibold text-brown transition hover:border-orange/30">
                  <ImagePlus size={16} className="text-orange" aria-hidden />
                  Upload image
                  <input
                    type="file"
                    accept={IMAGE_ACCEPT}
                    className="sr-only"
                    onChange={(e) => {
                      void handleImageUpload(e.target.files?.[0] ?? null)
                      e.target.value = ''
                    }}
                  />
                </label>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl('')
                      setImageUploadError(null)
                    }}
                    className="inline-flex items-center gap-1 rounded-[14px] border border-app-subtle px-3 py-2 text-xs font-semibold text-brown-muted transition hover:border-orange/30"
                  >
                    <X size={14} aria-hidden />
                    Remove
                  </button>
                )}
              </div>
              {imageUploadError && (
                <p className="mt-1 text-xs font-semibold text-maroon">{imageUploadError}</p>
              )}
              {imageCompressing && (
                <p className="mt-1 text-xs text-brown-muted">Compressing image…</p>
              )}
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt=""
                  className="mt-2 h-20 w-20 rounded-[10px] object-cover"
                />
              )}
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Price (CAD)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="app-field w-full"
            />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Sizes & stock</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {MERCH_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`rounded-[10px] border px-2 py-1 text-xs font-semibold ${
                      sizes.includes(size)
                        ? 'border-orange bg-orange/10 text-orange'
                        : 'border-brown/15 text-brown-muted'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {sizes.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {sortMerchSizes(sizes).map((size) => (
                    <li
                      key={size}
                      className="flex items-center justify-between gap-3 rounded-[12px] border border-app-subtle bg-cream px-3 py-2"
                    >
                      <span className="text-xs font-semibold text-brown">{size}</span>
                      <label className="flex items-center gap-2 text-xs text-brown-muted">
                        Available
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={sizeStock[size] ?? 10}
                          onChange={(e) => setSizeQuantity(size, e.target.value)}
                          className="app-field w-20 py-1 text-center text-sm"
                          aria-label={`Available quantity for ${size}`}
                        />
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {addError && (
              <p className="text-xs font-semibold text-maroon" role="alert">
                {addError}
              </p>
            )}
            <GradientButton type="button" fullWidth className="py-2.5 text-sm" onClick={handleAddProduct}>
              <Plus size={16} className="mr-1 inline" />
              Add product
            </GradientButton>
          </div>
        </section>

        <section className="mt-4">
          <h2 className="font-display text-sm font-bold text-brown">Listed products ({products.length})</h2>
          <ul className="mt-2 space-y-2">
            {products.map((product) => (
              <li
                key={product.id}
                className="flex items-center gap-3 rounded-[14px] border border-brown/10 bg-white p-3"
              >
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-[10px] object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-brown">{product.name}</p>
                  <p className="text-xs text-brown-muted">
                    {formatMerchMoney(product.priceCents)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-brown-muted">
                    {sortMerchSizes(product.sizes).map((size) => {
                      const left = getMerchSizeAvailable(product, size)
                      return `${size} (${left})`
                    }).join(' · ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const result = deleteMerchProduct(product.id)
                    if (!result.ok) {
                      setAddError(result.error)
                      return
                    }
                    setAddError(null)
                    reload()
                  }}
                  className="shrink-0 rounded-full p-2 text-maroon hover:bg-maroon/5"
                  aria-label="Remove product"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-[14px] border border-orange/20 bg-orange/5 p-4">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-orange" aria-hidden />
            <h2 className="font-display text-sm font-bold text-brown">Stock the shelf</h2>
          </div>
          <p className="mt-1 text-xs text-brown-muted">
            Pre-orders waiting for pickup — what to have ready on the merch shelf.
          </p>
          {stockReport.length === 0 ? (
            <p className="mt-3 text-sm text-brown-muted">No open pre-orders yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {stockReport.map((line) => (
                <li
                  key={`${line.productId}-${line.size}`}
                  className="flex items-center justify-between rounded-[12px] border border-brown/10 bg-white px-3 py-2 text-sm"
                >
                  <span>
                    {line.productName} · <strong>{line.size}</strong>
                  </span>
                  <span className="font-display font-bold text-brown">×{line.quantity}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <MerchFulfillmentPanel event={event} refreshKey={refresh} onRedeemed={reload} />
      </main>

      <BottomNav />
    </div>
  )
}
