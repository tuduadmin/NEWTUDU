import { useEffect, useMemo, useState } from 'react'
import { MapPin, Plus, Trash2 } from 'lucide-react'
import {
  AdminBadge,
  AdminButton,
  AdminDrawer,
  AdminInput,
  AdminPanel,
  AdminSelect,
} from './AdminUI'
import type { ChartPoint } from '../../lib/adminAnalytics'
import {
  addMarketingCampaign,
  deleteMarketingCampaign,
  getMarketingCampaignById,
  getMarketingCampaignImpact,
  getMarketingCampaigns,
  getMarketingChannelPinColor,
  isCampaignOnChart,
  localIsoDate,
  MARKETING_CAMPAIGNS_CHANGED_EVENT,
  MARKETING_CHANNEL_LABELS,
  type MarketingCampaign,
  type MarketingChannel,
} from '../../lib/adminMarketingCampaigns'

type AdminMarketingCampaignsPanelProps = {
  chartData: ChartPoint[]
  chartRangeDays?: number
  selectedId: string | null
  onSelect: (id: string | null) => void
}

const CHANNELS = Object.keys(MARKETING_CHANNEL_LABELS) as MarketingChannel[]

export default function AdminMarketingCampaignsPanel({
  chartData,
  chartRangeDays = 30,
  selectedId,
  onSelect,
}: AdminMarketingCampaignsPanelProps) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [channel, setChannel] = useState<MarketingChannel>('facebook')
  const [date, setDate] = useState(localIsoDate())
  const [spend, setSpend] = useState('')
  const [followersGained, setFollowersGained] = useState('')
  const [notes, setNotes] = useState('')
  const [link, setLink] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    function onChanged() {
      setRefresh((n) => n + 1)
    }
    window.addEventListener(MARKETING_CAMPAIGNS_CHANGED_EVENT, onChanged)
    window.addEventListener('storage', onChanged)
    return () => {
      window.removeEventListener(MARKETING_CAMPAIGNS_CHANGED_EVENT, onChanged)
      window.removeEventListener('storage', onChanged)
    }
  }, [])

  const campaigns = useMemo(() => {
    void refresh
    return getMarketingCampaigns()
  }, [chartData, refresh])
  const selected = selectedId ? getMarketingCampaignById(selectedId) ?? null : null

  const selectedImpact = useMemo(
    () => (selected ? getMarketingCampaignImpact(selected, chartData) : null),
    [selected, chartData],
  )

  function resetForm() {
    setName('')
    setChannel('facebook')
    setDate(localIsoDate())
    setSpend('')
    setFollowersGained('')
    setNotes('')
    setLink('')
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName || !date) return

    const campaign = addMarketingCampaign({
      name: trimmedName,
      channel,
      date,
      spend: spend.trim() ? Number.parseFloat(spend) : undefined,
      followersGained: followersGained.trim() ? Number.parseInt(followersGained, 10) : undefined,
      notes: notes.trim() || undefined,
      link: link.trim() || undefined,
    })

    resetForm()
    setShowForm(false)
    onSelect(campaign.id)
  }

  return (
    <>
      <AdminPanel className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="admin-label">Marketing pins</p>
            <p className="mt-0.5 text-[10px] text-[var(--admin-text-dim)]">
              Log Facebook posts, ads, and pushes — pins appear on the growth chart when the date
              falls within the selected range (currently {chartRangeDays} days).
            </p>
          </div>
          <AdminButton
            variant="secondary"
            onClick={() => {
              setShowForm((open) => !open)
              if (showForm) resetForm()
            }}
          >
            <Plus size={14} aria-hidden />
            {showForm ? 'Cancel' : 'Add pin'}
          </AdminButton>
        </div>

        {showForm && (
          <form
            onSubmit={handleAdd}
            className="grid gap-3 rounded-[var(--admin-radius)] border border-[var(--admin-border)] p-3 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label className="admin-label">Campaign name</label>
              <AdminInput
                className="mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kindersley summer FB post"
                required
              />
            </div>
            <div>
              <label className="admin-label">Channel</label>
              <AdminSelect
                className="mt-1"
                value={channel}
                onChange={(e) => setChannel(e.target.value as MarketingChannel)}
              >
                {CHANNELS.map((id) => (
                  <option key={id} value={id}>
                    {MARKETING_CHANNEL_LABELS[id]}
                  </option>
                ))}
              </AdminSelect>
            </div>
            <div>
              <label className="admin-label">Date posted</label>
              <AdminInput
                className="mt-1"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="admin-label">Spend ($)</label>
              <AdminInput
                className="mt-1"
                type="number"
                min="0"
                step="0.01"
                value={spend}
                onChange={(e) => setSpend(e.target.value)}
                placeholder="50"
              />
            </div>
            <div>
              <label className="admin-label">Followers gained</label>
              <AdminInput
                className="mt-1"
                type="number"
                min="0"
                step="1"
                value={followersGained}
                onChange={(e) => setFollowersGained(e.target.value)}
                placeholder="100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="admin-label">Link (optional)</label>
              <AdminInput
                className="mt-1"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://facebook.com/…"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="admin-label">Notes</label>
              <textarea
                className="admin-input mt-1 w-full resize-y text-xs"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Boosted post, local audience 25–45…"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <AdminButton type="submit" variant="primary" disabled={!name.trim()}>
                Save pin
              </AdminButton>
            </div>
          </form>
        )}

        {campaigns.length === 0 ? (
          <p className="text-xs text-[var(--admin-text-dim)]">
            No pins yet. Click <strong className="text-[var(--admin-text-muted)]">Add pin</strong>{' '}
            to log a Facebook post or campaign — it appears on the chart when the date is within the
            selected {chartRangeDays}-day range.
          </p>
        ) : (
          <ul className="space-y-2">
            {campaigns.map((campaign) => (
              <CampaignRow
                key={campaign.id}
                campaign={campaign}
                chartData={chartData}
                onChart={isCampaignOnChart(campaign, chartData)}
                chartRangeDays={chartRangeDays}
                selected={campaign.id === selectedId}
                onOpen={() => onSelect(campaign.id)}
              />
            ))}
          </ul>
        )}
      </AdminPanel>

      <AdminDrawer
        open={!!selected}
        title={selected?.name ?? 'Campaign'}
        onClose={() => onSelect(null)}
        wide
      >
        {selected && selectedImpact && (
          <CampaignDetail
            campaign={selected}
            impact={selectedImpact}
            chartRangeDays={chartRangeDays}
            onDelete={() => {
              deleteMarketingCampaign(selected.id)
              onSelect(null)
            }}
          />
        )}
      </AdminDrawer>
    </>
  )
}

function CampaignRow({
  campaign,
  chartData,
  onChart,
  chartRangeDays,
  selected,
  onOpen,
}: {
  campaign: MarketingCampaign
  chartData: ChartPoint[]
  onChart: boolean
  chartRangeDays: number
  selected: boolean
  onOpen: () => void
}) {
  const impact = getMarketingCampaignImpact(campaign, chartData)
  const color = getMarketingChannelPinColor(campaign.channel)

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className={`flex w-full items-start gap-2 rounded-[var(--admin-radius)] border px-3 py-2 text-left transition ${
          selected
            ? 'border-[var(--admin-accent)] bg-[var(--admin-accent)]/10'
            : 'border-[var(--admin-border)] hover:bg-white/[0.02]'
        }`}
      >
        <span
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}22`, color }}
          aria-hidden
        >
          <MapPin size={12} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-[var(--admin-text)]">{campaign.name}</span>
            <AdminBadge tone="neutral">{MARKETING_CHANNEL_LABELS[campaign.channel]}</AdminBadge>
            {onChart ? (
              <AdminBadge tone="cyan">On chart</AdminBadge>
            ) : (
              <AdminBadge tone="amber">Outside {chartRangeDays}d</AdminBadge>
            )}
          </span>
          <span className="mt-0.5 block text-[10px] text-[var(--admin-text-dim)]">
            {new Date(`${campaign.date}T12:00:00`).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
            {onChart && impact.inChartRange && (
              <>
                {' · '}
                <span className={impact.signupLift >= 0 ? 'text-[var(--admin-success)]' : 'text-[var(--admin-danger)]'}>
                  {impact.signupLift >= 0 ? '+' : ''}
                  {impact.signupLift} signups vs prior {impact.windowDays}d
                </span>
              </>
            )}
          </span>
        </span>
      </button>
    </li>
  )
}

function CampaignDetail({
  campaign,
  impact,
  chartRangeDays,
  onDelete,
}: {
  campaign: MarketingCampaign
  impact: ReturnType<typeof getMarketingCampaignImpact>
  chartRangeDays: number
  onDelete: () => void
}) {
  const color = getMarketingChannelPinColor(campaign.channel)

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: `${color}22`, color }}
        >
          <MapPin size={11} aria-hidden />
          {MARKETING_CHANNEL_LABELS[campaign.channel]}
        </span>
        <span className="text-xs text-[var(--admin-text-muted)]">
          {new Date(`${campaign.date}T12:00:00`).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </div>

      {!impact.inChartRange && (
        <p className="text-xs text-[var(--admin-text-dim)]">
          This pin is outside the current {chartRangeDays}-day chart — widen the range (up to 90d) on
          the chart dropdown to compare before/after signups.
        </p>
      )}

      {impact.inChartRange && (
        <div className="grid gap-2 sm:grid-cols-2">
          <ImpactCard
            label={`Signups — ${impact.windowDays}d before`}
            value={impact.signupsBefore}
            accent="neutral"
          />
          <ImpactCard
            label={`Signups — ${impact.windowDays}d from pin`}
            value={impact.signupsAfter}
            accent="cyan"
          />
          <ImpactCard
            label={`Events — ${impact.windowDays}d before`}
            value={impact.eventsBefore}
            accent="neutral"
          />
          <ImpactCard
            label={`Events — ${impact.windowDays}d from pin`}
            value={impact.eventsAfter}
            accent="emerald"
          />
        </div>
      )}

      {(campaign.spend != null || campaign.followersGained != null) && (
        <div className="admin-panel space-y-2 p-3">
          <p className="admin-label">Cost efficiency</p>
          <dl className="grid gap-2 text-xs sm:grid-cols-2">
            {campaign.spend != null && (
              <div>
                <dt className="text-[var(--admin-text-dim)]">Spend</dt>
                <dd className="admin-tabular font-medium">${campaign.spend.toFixed(2)}</dd>
              </div>
            )}
            {campaign.followersGained != null && (
              <div>
                <dt className="text-[var(--admin-text-dim)]">Followers gained</dt>
                <dd className="admin-tabular font-medium">{campaign.followersGained}</dd>
              </div>
            )}
            {impact.costPerFollower && (
              <div>
                <dt className="text-[var(--admin-text-dim)]">Cost per follower</dt>
                <dd className="admin-tabular font-medium text-[var(--admin-accent)]">
                  {impact.costPerFollower}
                </dd>
              </div>
            )}
            {impact.costPerSignup && (
              <div>
                <dt className="text-[var(--admin-text-dim)]">Cost per signup (pin window)</dt>
                <dd className="admin-tabular font-medium text-[var(--admin-accent)]">
                  {impact.costPerSignup}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {campaign.notes && (
        <div>
          <p className="admin-label">Notes</p>
          <p className="text-xs leading-relaxed text-[var(--admin-text-muted)]">{campaign.notes}</p>
        </div>
      )}

      {campaign.link && (
        <div>
          <p className="admin-label">Link</p>
          <a
            href={campaign.link}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[var(--admin-accent)] break-all hover:underline"
          >
            {campaign.link}
          </a>
        </div>
      )}

      <AdminButton variant="danger" onClick={onDelete}>
        <Trash2 size={14} aria-hidden />
        Delete pin
      </AdminButton>
    </div>
  )
}

function ImpactCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: 'neutral' | 'cyan' | 'emerald'
}) {
  const valueClass =
    accent === 'cyan'
      ? 'text-[var(--admin-accent)]'
      : accent === 'emerald'
        ? 'text-[var(--admin-success)]'
        : 'text-[var(--admin-text)]'

  return (
    <div className="admin-panel p-3">
      <p className="admin-label">{label}</p>
      <p className={`admin-kpi-value mt-1 ${valueClass}`}>{value}</p>
    </div>
  )
}
