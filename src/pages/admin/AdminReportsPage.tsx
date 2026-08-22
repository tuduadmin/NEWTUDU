import { useMemo, useState } from 'react'
import AdminGeoFilterBar from '../../components/admin/AdminGeoFilterBar'
import {
  AdminButton,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
} from '../../components/admin/AdminUI'
import {
  ADMIN_REPORT_SECTIONS,
  buildAdminReportPayload,
  buildComparisonTableRows,
  defaultReportDateRange,
  exportAdminReportPdf,
  formatComparisonValue,
  formatGrowthCell,
  type AdminReportSectionId,
} from '../../lib/adminReports'
import type { AnalyticsFilters } from '../../lib/adminAnalytics'

const EMPTY_FILTERS: AnalyticsFilters = {
  country: 'all',
  province: 'all',
  city: 'all',
}

export default function AdminReportsPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>(EMPTY_FILTERS)
  const [range, setRange] = useState(defaultReportDateRange)
  const [selected, setSelected] = useState<Set<AdminReportSectionId>>(
    () =>
      new Set(
        ADMIN_REPORT_SECTIONS.filter((section) => section.defaultSelected).map(
          (section) => section.id,
        ),
      ),
  )
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  const sections = useMemo(() => [...selected], [selected])

  const preview = useMemo(
    () =>
      buildAdminReportPayload({
        range,
        filters,
        sections: sections.length ? sections : ['analytics_kpis'],
      }),
    [range, filters, sections],
  )

  function toggleSection(id: AdminReportSectionId) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(ADMIN_REPORT_SECTIONS.map((section) => section.id)))
  }

  function selectNone() {
    setSelected(new Set())
  }

  async function handleExport() {
    setError('')
    setExporting(true)
    try {
      const result = await exportAdminReportPdf({ range, filters, sections })
      if (!result.ok) setError(result.error)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF export failed.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <AdminPageHeader
        title="Reports"
        subtitle="Build a PDF from local Control Room data for the date range you choose."
      />

      <AdminPanel className="mb-4 space-y-4">
        <p className="text-xs leading-relaxed text-[var(--admin-text-muted)]">
          Exports use data stored in this browser (Phase 1). Choose a date range, tick the sections
          you need, then download PDF. Ticket transactions include every transaction ID in range.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="admin-label">Start date</span>
            <AdminInput
              type="date"
              className="mt-1"
              value={range.startDate}
              onChange={(e) => setRange((prev) => ({ ...prev, startDate: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="admin-label">End date</span>
            <AdminInput
              type="date"
              className="mt-1"
              value={range.endDate}
              onChange={(e) => setRange((prev) => ({ ...prev, endDate: e.target.value }))}
            />
          </label>
        </div>
      </AdminPanel>

      <AdminGeoFilterBar
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters(EMPTY_FILTERS)}
      />

      <AdminPanel className="mb-4 mt-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="admin-label">Include in PDF</span>
          <div className="flex gap-2">
            <AdminButton type="button" variant="ghost" className="px-2 py-1 text-[11px]" onClick={selectAll}>
              All
            </AdminButton>
            <AdminButton type="button" variant="ghost" className="px-2 py-1 text-[11px]" onClick={selectNone}>
              None
            </AdminButton>
          </div>
        </div>

        <ul className="space-y-2">
          {ADMIN_REPORT_SECTIONS.map((section) => {
            const checked = selected.has(section.id)
            return (
              <li key={section.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-[var(--admin-radius)] border border-[var(--admin-border-subtle)] px-3 py-2.5 hover:bg-[var(--admin-bg)]">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSection(section.id)}
                    className="mt-0.5 h-4 w-4 accent-[var(--admin-accent)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-[var(--admin-text)]">
                      {section.label}
                    </span>
                    <span className="block text-[11px] text-[var(--admin-text-muted)]">
                      {section.description}
                    </span>
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      </AdminPanel>

      <AdminPanel className="mb-4 space-y-2">
        <p className="admin-label">Preview counts</p>
        {selected.has('month_over_month') && preview.periodAnalysis ? (
          <>
            <p className="text-[11px] text-[var(--admin-text-muted)]">
              Month-over-month: {preview.periodAnalysis.previousMonthLabel} vs{' '}
              {preview.periodAnalysis.currentMonthLabel} (from report end date)
            </p>
            <div className="overflow-x-auto rounded-[var(--admin-radius)] border border-[var(--admin-border-subtle)]">
              <table className="w-full min-w-[28rem] text-left text-[11px]">
                <thead>
                  <tr className="border-b border-[var(--admin-border-subtle)] bg-[var(--admin-bg)]">
                    <th className="px-2 py-1.5 font-medium text-[var(--admin-text)]">Metric</th>
                    <th className="px-2 py-1.5 font-medium text-[var(--admin-text)]">
                      {preview.periodAnalysis.previousMonthLabel}
                    </th>
                    <th className="px-2 py-1.5 font-medium text-[var(--admin-text)]">
                      {preview.periodAnalysis.currentMonthLabel}
                    </th>
                    <th className="px-2 py-1.5 font-medium text-[var(--admin-text)]">Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {buildComparisonTableRows(preview.periodAnalysis.comparisons).map((row) => (
                    <tr
                      key={row.label}
                      className="border-b border-[var(--admin-border-subtle)] last:border-b-0"
                    >
                      <td className="px-2 py-1 text-[var(--admin-text-muted)]">{row.label}</td>
                      <td className="px-2 py-1 text-[var(--admin-text)]">
                        {formatComparisonValue(row.comp.previous, { isCurrency: row.isCurrency })}
                      </td>
                      <td className="px-2 py-1 text-[var(--admin-text)]">
                        {formatComparisonValue(row.comp.current, { isCurrency: row.isCurrency })}
                      </td>
                      <td className="px-2 py-1 text-[var(--admin-text)]">
                        {formatGrowthCell(row.comp, { isCurrency: row.isCurrency })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
        <ul className="grid gap-1 text-xs text-[var(--admin-text-muted)] sm:grid-cols-2">
          {selected.has('analytics_kpis') && preview.kpis ? (
            <li>Users (all-time): {preview.kpis.totalUsers}</li>
          ) : null}
          {selected.has('growth_chart') && preview.chart ? (
            <li>Growth days: {preview.chart.length}</li>
          ) : null}
          {selected.has('ticket_transactions') && preview.transactions ? (
            <li>Ticket transactions: {preview.transactions.length}</li>
          ) : null}
          {selected.has('activity_log') && preview.activity ? (
            <li>Activity rows: {preview.activity.length}</li>
          ) : null}
          {selected.has('feedback') && preview.feedback ? (
            <li>
              Feedback & reports: {preview.feedback.length} (
              {preview.feedback.filter((item) => item.status === 'open').length} open)
            </li>
          ) : null}
          {selected.has('security') && preview.security ? (
            <li>Security events: {preview.security.length}</li>
          ) : null}
          {selected.has('ticket_sales') && preview.ticketSales ? (
            <li>Paid transactions (all-time): {preview.ticketSales.paidTransactions}</li>
          ) : null}
        </ul>
      </AdminPanel>

      {error ? (
        <p className="mb-3 text-xs text-[var(--admin-danger)]" role="alert">
          {error}
        </p>
      ) : null}

      <AdminButton
        type="button"
        variant="primary"
        className="w-full py-2.5"
        disabled={exporting || sections.length === 0}
        onClick={handleExport}
      >
        {exporting ? 'Generating PDF…' : 'Export PDF'}
      </AdminButton>
    </div>
  )
}
