import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Bookmark,
  Car,
  Eye,
  ListChecks,
  MapPin,
  Megaphone,
  Sparkles,
  Tag,
  Users,
} from 'lucide-react'
import {
  formatSaveContextLabel,
  getHiddenGemAnalytics,
  sendHiddenGemPromoPush,
  type HiddenGemAnalyticsSnapshot,
} from '../../lib/hiddenGemAnalytics'
import { setHiddenGemPromoCode } from '../../lib/hiddenGems'
import { formatRelativeTime } from '../../lib/adminAnalytics'
import GradientButton from '../GradientButton'

type HiddenGemAnalyticsPanelProps = {
  gemId: string
  compact?: boolean
  onUpdated?: () => void
}

function MetricTile({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-[14px] border border-app-subtle bg-app-elevated px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-brown-muted">
        {icon}
        {label}
      </div>
      <p className="mt-1 font-display text-xl font-bold tabular-nums text-brown">{value}</p>
    </div>
  )
}

function GeographyList({
  title,
  rows,
  emptyLabel,
}: {
  title: string
  rows: HiddenGemAnalyticsSnapshot['saverGeography']
  emptyLabel: string
}) {
  return (
    <div className="rounded-[14px] border border-app-subtle bg-app-elevated p-4">
      <div className="flex items-center gap-2">
        <MapPin size={14} className="text-orange" />
        <h3 className="font-display text-sm font-bold text-brown">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="mt-2 text-xs text-brown-muted">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.slice(0, 6).map((row) => (
            <li key={row.city} className="flex items-center justify-between text-xs">
              <span className="font-medium text-brown">{row.city}</span>
              <span className="tabular-nums text-brown-muted">
                {row.count}
                {row.distant > 0 ? ` · ${row.distant} distant` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function HiddenGemAnalyticsPanel({
  gemId,
  compact = false,
  onUpdated,
}: HiddenGemAnalyticsPanelProps) {
  const [refresh, setRefresh] = useState(0)
  const [promoDraft, setPromoDraft] = useState('')
  const [promoMessage, setPromoMessage] = useState<string | null>(null)
  const [pushAudience, setPushAudience] = useState<'all_savers' | 'distant_savers'>('distant_savers')

  const analytics = useMemo(() => {
    void refresh
    return getHiddenGemAnalytics(gemId)
  }, [gemId, refresh])

  useEffect(() => {
    setPromoDraft('')
    setPromoMessage(null)
  }, [gemId])

  if (!analytics) {
    return (
      <p className="text-sm text-brown-muted">Hidden Gem not found.</p>
    )
  }

  const effectivePromoDraft = promoDraft || analytics.promoCode || ''

  const saveContexts = [
    { key: 'saved' as const, icon: <Bookmark size={12} />, count: analytics.savesByContext.saved },
    { key: 'bucket_list' as const, icon: <ListChecks size={12} />, count: analytics.savesByContext.bucket_list },
    { key: 'road_trip' as const, icon: <Car size={12} />, count: analytics.savesByContext.road_trip },
  ]

  function handleSavePromo() {
    setHiddenGemPromoCode(gemId, effectivePromoDraft)
    setPromoMessage('Promo code saved')
    setRefresh((n) => n + 1)
    onUpdated?.()
  }

  function handlePromoPush() {
    const code = effectivePromoDraft.trim()
    if (!code) {
      setPromoMessage('Add a promo code first')
      return
    }
    const result = sendHiddenGemPromoPush({
      gemId,
      promoCode: code,
      audience: pushAudience,
    })
    if (!result) {
      setPromoMessage('No savers match that audience yet')
      return
    }
    setPromoMessage(`Promo push sent to ${result.recipientCount} saver${result.recipientCount === 1 ? '' : 's'}`)
    setRefresh((n) => n + 1)
    onUpdated?.()
  }

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-orange" />
            <h2 className="font-display text-base font-bold text-brown">Hidden Gem insights</h2>
          </div>
          <p className="mt-1 text-xs text-brown-muted">
            {analytics.title} · {analytics.eventCity}
          </p>
        </div>
        {!compact && (
          <Link
            to={`/host/hidden-gem/insights/${encodeURIComponent(gemId)}`}
            className="shrink-0 text-xs font-semibold text-orange no-underline"
          >
            Full report
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricTile label="Views" value={analytics.views} icon={<Eye size={12} />} />
        <MetricTile label="Opens" value={analytics.opens} icon={<Sparkles size={12} />} />
        <MetricTile label="Saves" value={analytics.saves} icon={<Bookmark size={12} />} />
        <MetricTile label="People" value={analytics.uniqueSavers} icon={<Users size={12} />} />
      </div>

      <div className="rounded-[14px] border border-app-subtle bg-app-elevated p-4">
        <h3 className="font-display text-sm font-bold text-brown">Saved where</h3>
        <p className="mt-1 text-xs text-brown-muted">
          How people kept your gem — My Tudu saved, bucket lists, or road trips.
        </p>
        <ul className="mt-3 space-y-2">
          {saveContexts.map((ctx) => (
            <li key={ctx.key} className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-medium text-brown">
                {ctx.icon}
                {formatSaveContextLabel(ctx.key)}
              </span>
              <span className="font-bold tabular-nums text-brown">{ctx.count}</span>
            </li>
          ))}
        </ul>
        {analytics.distantSavers > 0 && (
          <p className="mt-3 text-xs text-brown-muted">
            <strong className="text-brown">{analytics.distantSavers}</strong> saver
            {analytics.distantSavers === 1 ? '' : 's'} from outside {analytics.eventCity}.
          </p>
        )}
      </div>

      <div className={`grid gap-3 ${compact ? '' : 'md:grid-cols-2'}`}>
        <GeographyList
          title="Where savers are from"
          rows={analytics.saverGeography}
          emptyLabel="No saves yet — publish to Discover to start tracking."
        />
        <GeographyList
          title="Where viewers are from"
          rows={analytics.viewerGeography}
          emptyLabel="View location appears after people swipe or open your gem."
        />
      </div>

      <div className="rounded-[14px] border border-app-subtle bg-app-elevated p-4">
        <div className="flex items-center gap-2">
          <Tag size={14} className="text-orange" />
          <h3 className="font-display text-sm font-bold text-brown">Promo code</h3>
        </div>
        <p className="mt-1 text-xs text-brown-muted">
          Offer a code for travelers who saved your gem from out of town.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={promoDraft}
            onChange={(e) => setPromoDraft(e.target.value.toUpperCase())}
            placeholder={analytics.promoCode || 'e.g. WELCOME10'}
            className="min-w-0 flex-1 rounded-[14px] border border-app-subtle bg-cream px-3 py-2 font-mono text-sm text-brown"
          />
          <button
            type="button"
            onClick={handleSavePromo}
            className="shrink-0 rounded-[14px] border border-app-subtle bg-app-elevated px-3 py-2 text-xs font-semibold text-brown transition hover:border-orange/30"
          >
            Save
          </button>
        </div>
      </div>

      <div className="rounded-[14px] border border-purple/20 bg-purple/5 p-4">
        <div className="flex items-center gap-2">
          <Megaphone size={14} className="text-purple" />
          <h3 className="font-display text-sm font-bold text-brown">Promo push</h3>
        </div>
        <p className="mt-1 text-xs text-brown-muted">
          Send your promo code to people who saved your gem. Uses Event Boost delivery — pair with a
          deck boost for maximum reach.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPushAudience('distant_savers')}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              pushAudience === 'distant_savers'
                ? 'bg-purple text-white'
                : 'border border-app-subtle text-brown-muted'
            }`}
          >
            Distant savers
          </button>
          <button
            type="button"
            onClick={() => setPushAudience('all_savers')}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              pushAudience === 'all_savers'
                ? 'bg-purple text-white'
                : 'border border-app-subtle text-brown-muted'
            }`}
          >
            All savers
          </button>
        </div>
        <GradientButton type="button" onClick={handlePromoPush} className="mt-3 w-full py-2.5 text-sm">
          Send promo push
        </GradientButton>
        {analytics.promoPushes.length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-purple/10 pt-3">
            {analytics.promoPushes.slice(0, 3).map((push) => (
              <li key={push.id} className="text-[10px] text-brown-muted">
                {formatRelativeTime(push.sentAt)} · {push.recipientCount} recipients · {push.promoCode}
              </li>
            ))}
          </ul>
        )}
      </div>

      {promoMessage && (
        <p className="text-xs font-semibold text-orange">{promoMessage}</p>
      )}

      {!compact && analytics.recentSaves.length > 0 && (
        <div className="rounded-[14px] border border-app-subtle bg-app-elevated p-4">
          <h3 className="font-display text-sm font-bold text-brown">Recent saves</h3>
          <ul className="mt-3 divide-y divide-app-subtle">
            {analytics.recentSaves.map((save) => (
              <li key={save.id} className="flex items-center justify-between py-2 text-xs">
                <span className="text-brown-muted">
                  {formatSaveContextLabel(save.saveContext)} · {save.saverCity}
                  {save.isDistant ? ' (distant)' : ''}
                </span>
                <span className="text-brown-muted/70">{formatRelativeTime(save.savedAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
