import { useMemo } from 'react'
import {
  calcEarningsComparison,
  CALCULATOR_TICKET_COUNT_MAX,
  CALCULATOR_TICKET_COUNT_MIN,
  CALCULATOR_TICKET_COUNT_STEP,
  CALCULATOR_TICKET_PRICE_MAX,
  CALCULATOR_TICKET_PRICE_MIN,
  CALCULATOR_TICKET_PRICE_STEP,
  formatMoney,
  getCalculatorTierFeeLabel,
  getLowestFeeOrgTier,
  getOrgTierRecommendationMessage,
  getRecommendedOrgTier,
  PLATFORM_BENCHMARKS,
} from '../../lib/tierPricing'
import type { TierPlanId, TierConfig } from '../../lib/tierConfig'

type EarningsComparisonCalculatorProps = {
  compact?: boolean
  calcTier: TierPlanId
  calcPlans: TierPlanId[]
  ticketPrice: number
  ticketCount: number
  config: TierConfig
  /** Show ticket-price tier guidance (Org tab). */
  showOrgTierRecommendation?: boolean
  onCalcTierChange: (tier: TierPlanId) => void
  onTicketPriceChange: (price: number) => void
  onTicketCountChange: (count: number) => void
}

export default function EarningsComparisonCalculator({
  compact = false,
  calcTier,
  calcPlans,
  ticketPrice,
  ticketCount,
  config,
  showOrgTierRecommendation = false,
  onCalcTierChange,
  onTicketPriceChange,
  onTicketCountChange,
}: EarningsComparisonCalculatorProps) {
  const comparison = useMemo(
    () => calcEarningsComparison(ticketPrice, ticketCount, calcTier),
    [ticketPrice, ticketCount, calcTier],
  )

  const recommendedOrgTier = showOrgTierRecommendation ? getRecommendedOrgTier(ticketPrice) : null
  const feeAlignedOrgTier =
    showOrgTierRecommendation ? getLowestFeeOrgTier(ticketPrice, ticketCount) : null
  const recommendedTierAccent = recommendedOrgTier
    ? config.badges[recommendedOrgTier].cardBorderColor
    : null

  const tierAccent = config.badges[calcTier].cardBorderColor
  const heroSavings = Math.max(comparison.savingsVsWorst, 0)
  const barMax = Math.max(...comparison.chartEntries.map((e) => e.net), 1)

  const chartEntries = comparison.chartEntries.map((entry) =>
    entry.isTudu ? { ...entry, barColor: tierAccent } : entry,
  )

  return (
    <div>
      <h3 className={`font-display font-bold text-brown ${compact ? 'text-xs' : 'text-sm'}`}>
        Earnings estimate
      </h3>

      <div className={`mt-3 flex flex-wrap gap-2 pt-1 ${compact ? 'text-[10px]' : 'text-xs'}`}>
        {calcPlans.map((id) => {
          const isSelected = calcTier === id
          const isRecommended = recommendedOrgTier === id
          const badge = config.badges[id]
          const accent = badge.cardBorderColor
          const feeLabel = getCalculatorTierFeeLabel(id)

          return (
            <button
              key={id}
              type="button"
              onClick={() => onCalcTierChange(id)}
              aria-pressed={isSelected}
              aria-label={`${badge.label} — ${feeLabel}`}
              className={`relative rounded-[14px] px-2.5 py-1.5 text-left font-semibold transition ${
                isSelected ? 'text-brown' : 'bg-cream text-brown-muted hover:text-brown'
              }`}
              style={{
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: isSelected
                  ? accent
                  : `color-mix(in srgb, ${accent} 28%, transparent)`,
                ...(isSelected
                  ? {
                      backgroundColor: `color-mix(in srgb, ${accent} 18%, transparent)`,
                      color: accent,
                    }
                  : undefined),
                ...(isRecommended
                  ? {
                      boxShadow: `0 0 0 2px color-mix(in srgb, ${accent} 45%, transparent)`,
                    }
                  : undefined),
              }}
            >
              <span className="block leading-tight">{badge.label}</span>
              <span
                className={`mt-0.5 block font-normal tabular-nums leading-tight ${
                  isSelected ? 'opacity-90' : 'text-brown-muted'
                } ${compact ? 'text-[8px]' : 'text-[9px]'}`}
              >
                {feeLabel}
              </span>
              {isRecommended && (
                <span
                  className={`absolute -right-1 -top-2 rounded-full px-1.5 py-px font-bold uppercase tracking-wide text-white ${
                    compact ? 'text-[7px]' : 'text-[8px]'
                  }`}
                  style={{ backgroundColor: accent }}
                >
                  Best fit
                </span>
              )}
            </button>
          )
        })}
      </div>

      {recommendedOrgTier && recommendedTierAccent && (
        <OrgTierRecommendationCallout
          compact={compact}
          message={getOrgTierRecommendationMessage(
            ticketPrice,
            config.badges[recommendedOrgTier].label,
            recommendedOrgTier,
          )}
          accentColor={recommendedTierAccent}
          feeAligned={feeAlignedOrgTier === recommendedOrgTier}
        />
      )}

      <div className={`mt-4 text-center ${compact ? 'py-2' : 'py-3'}`}>
        <p className={`font-display font-extrabold text-success-deep ${compact ? 'text-xl' : 'text-2xl'}`}>
          You keep {formatMoney(heroSavings)} more
        </p>
        <p className={`mt-0.5 text-brown-muted ${compact ? 'text-[10px]' : 'text-xs'}`}>
          vs {comparison.worstBenchmarkLabel.toLowerCase()} on this event
        </p>
      </div>

      <div className={`mt-4 space-y-4 ${compact ? 'text-[10px]' : 'text-xs'}`}>
        <CalculatorSlider
          compact={compact}
          label="Ticket price"
          value={ticketPrice}
          min={CALCULATOR_TICKET_PRICE_MIN}
          max={CALCULATOR_TICKET_PRICE_MAX}
          step={CALCULATOR_TICKET_PRICE_STEP}
          displayValue={formatMoney(ticketPrice)}
          onChange={onTicketPriceChange}
        />
        <CalculatorSlider
          compact={compact}
          label="Tickets sold"
          value={ticketCount}
          min={CALCULATOR_TICKET_COUNT_MIN}
          max={CALCULATOR_TICKET_COUNT_MAX}
          step={CALCULATOR_TICKET_COUNT_STEP}
          displayValue={ticketCount.toLocaleString('en-CA')}
          onChange={onTicketCountChange}
        />
      </div>

      <div className={`mt-5 ${compact ? 'text-[10px]' : 'text-xs'}`}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="font-semibold text-brown">Net earnings (ranked)</span>
          <span className="text-brown-muted">
            {formatMoney(ticketPrice * ticketCount)} gross
          </span>
        </div>

        <div className="space-y-2.5">
          {chartEntries.map((entry, index) => (
            <RankedBar
              key={entry.key}
              rank={index + 1}
              label={entry.label}
              net={entry.net}
              barWidth={(entry.net / barMax) * 100}
              barColor={entry.barColor}
              isTudu={entry.isTudu}
              compact={compact}
            />
          ))}
        </div>

        <ComparisonLegend tierAccent={tierAccent} compact={compact} />
      </div>

      <p className={`mt-3 text-brown-muted ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
        Based on common published fee structures
      </p>
    </div>
  )
}

function OrgTierRecommendationCallout({
  compact,
  message,
  accentColor,
  feeAligned,
}: {
  compact: boolean
  message: string
  accentColor: string
  feeAligned: boolean
}) {
  return (
    <div
      className={`mt-3 rounded-[14px] border px-3 py-2 ${compact ? 'text-[10px]' : 'text-xs'}`}
      style={{
        borderColor: `color-mix(in srgb, ${accentColor} 40%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${accentColor} 10%, transparent)`,
      }}
      role="status"
      aria-live="polite"
    >
      <p className="font-semibold" style={{ color: accentColor }}>
        {message}
      </p>
      {feeAligned && (
        <p className={`mt-0.5 text-brown-muted ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
          Also the lowest fees at this ticket price
        </p>
      )}
    </div>
  )
}

function ComparisonLegend({ tierAccent, compact }: { tierAccent: string; compact: boolean }) {
  return (
    <div
      className={`mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-app-subtle pt-3 ${compact ? 'text-[9px]' : 'text-[10px]'}`}
      aria-label="Chart legend"
    >
      <LegendSwatch color={tierAccent} label="Tudu (your tier)" />
      {PLATFORM_BENCHMARKS.map((benchmark) => (
        <LegendSwatch key={benchmark.id} color={benchmark.barColor} label={benchmark.label} />
      ))}
    </div>
  )
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-brown-muted">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

function RankedBar({
  rank,
  label,
  net,
  barWidth,
  barColor,
  isTudu,
  compact,
}: {
  rank: number
  label: string
  net: number
  barWidth: number
  barColor: string
  isTudu: boolean
  compact: boolean
}) {
  const amountLabel = formatMoney(net)
  const showInsideBar = barWidth >= 28

  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full font-bold tabular-nums ${
            rank === 1 ? 'bg-success/15 text-success-deep' : 'bg-cream text-brown-muted'
          } ${compact ? 'text-[8px]' : 'text-[9px]'}`}
        >
          {rank}
        </span>
        <span className={`font-semibold ${isTudu ? 'text-brown' : 'text-brown-muted'}`}>
          {label}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <div className="h-7 overflow-hidden rounded-full bg-cream">
            <div
              className="flex h-full items-center rounded-full transition-[width] duration-200 ease-out"
              style={{
                width: `${Math.max(barWidth, net > 0 ? 4 : 0)}%`,
                backgroundColor: barColor,
                minWidth: showInsideBar ? undefined : '0',
              }}
            >
              {showInsideBar && (
                <span
                  className={`ml-auto pr-2 font-bold tabular-nums text-white drop-shadow-sm ${
                    compact ? 'text-[9px]' : 'text-[10px]'
                  }`}
                >
                  {amountLabel}
                </span>
              )}
            </div>
          </div>
        </div>
        {!showInsideBar && (
          <span
            className={`shrink-0 font-bold tabular-nums text-brown ${compact ? 'text-[10px]' : 'text-xs'}`}
          >
            {amountLabel}
          </span>
        )}
      </div>
    </div>
  )
}

function CalculatorSlider({
  compact,
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
}: {
  compact: boolean
  label: string
  value: number
  min: number
  max: number
  step: number
  displayValue: string
  onChange: (value: number) => void
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="font-semibold text-brown">{label}</span>
        <span className={`font-bold tabular-nums text-brown ${compact ? 'text-xs' : 'text-sm'}`}>
          {displayValue}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-orange"
        aria-label={label}
      />
      <div className="mt-1 flex justify-between text-brown-muted">
        <span>{min.toLocaleString('en-CA')}</span>
        <span>{max.toLocaleString('en-CA')}</span>
      </div>
    </div>
  )
}
