import { jsPDF } from 'jspdf'
import { getHostEvents } from './account'
import {
  eventMatchesFilters,
  formatCents,
  getCardOpensKPIs,
  getChartData,
  getFilteredActivityLog,
  getPlatformKPIs,
  getTicketSalesKPIs,
  getTopEventsByTicketSales,
  getUsersTierBreakdown,
  type ActivityLogEntry,
  type AnalyticsFilters,
  type ChartPoint,
} from './adminAnalytics'
import { getTopSearchKeywords } from './keywordAnalytics'
import { getFeedbackItems, getFeedbackStatusLabel, type FeedbackReport } from './adminFeedback'
import { getSecurityEvents, type SecurityEvent } from './adminSecurity'
import { getTicketTransactions, type TicketTransaction } from './ticketTransactions'

export type ReportDateRange = {
  startDate: string
  endDate: string
}

export type AdminReportSectionId =
  | 'month_over_month'
  | 'analytics_kpis'
  | 'growth_chart'
  | 'user_tiers'
  | 'engagement'
  | 'ticket_sales'
  | 'ticket_transactions'
  | 'activity_log'
  | 'feedback'
  | 'security'

export type AdminReportSection = {
  id: AdminReportSectionId
  label: string
  description: string
  defaultSelected: boolean
}

export const ADMIN_REPORT_SECTIONS: AdminReportSection[] = [
  {
    id: 'month_over_month',
    label: 'Month-over-month overview',
    description: 'Compare previous calendar month vs current (from report end date)',
    defaultSelected: true,
  },
  {
    id: 'analytics_kpis',
    label: 'Platform KPIs',
    description: 'Users, MAU, DAU, events, views, save rate, RSVPs',
    defaultSelected: true,
  },
  {
    id: 'growth_chart',
    label: 'Growth chart',
    description: 'Daily signups, events, RSVPs, DAU, and MAU',
    defaultSelected: true,
  },
  {
    id: 'user_tiers',
    label: 'User & org tiers',
    description: 'Personal and host account tier counts',
    defaultSelected: true,
  },
  {
    id: 'engagement',
    label: 'Engagement metrics',
    description: 'Card opens, saves, views, top search keywords',
    defaultSelected: true,
  },
  {
    id: 'ticket_sales',
    label: 'Ticket sales summary',
    description: 'Revenue, paid transactions, top events by sales',
    defaultSelected: true,
  },
  {
    id: 'ticket_transactions',
    label: 'Ticket transactions',
    description: 'Every transaction ID in the date range',
    defaultSelected: true,
  },
  {
    id: 'activity_log',
    label: 'Platform activity',
    description: 'Signups, moderation, messages — excludes sign-in noise',
    defaultSelected: true,
  },
  {
    id: 'feedback',
    label: 'Feedback & reports',
    description: 'User feedback and event reports with ticket numbers',
    defaultSelected: true,
  },
  {
    id: 'security',
    label: 'Security events',
    description: 'Failed logins, bans, suspicious activity — with ticket numbers',
    defaultSelected: true,
  },
]

export function defaultReportDateRange(): ReportDateRange {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 29)
  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end),
  }
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function isTimestampInRange(
  isoTimestamp: string,
  range: ReportDateRange,
): boolean {
  const day = isoTimestamp.slice(0, 10)
  return day >= range.startDate && day <= range.endDate
}

export function chartPointsInRange(
  points: ChartPoint[],
  range: ReportDateRange,
): ChartPoint[] {
  return points.filter(
    (point) => point.date >= range.startDate && point.date <= range.endDate,
  )
}

export function filterTransactionsInRange(
  transactions: TicketTransaction[],
  range: ReportDateRange,
): TicketTransaction[] {
  return transactions.filter((txn) => isTimestampInRange(txn.timestamp, range))
}

export function filterFeedbackInRange(
  items: FeedbackReport[],
  range: ReportDateRange,
): FeedbackReport[] {
  return items.filter((item) => isTimestampInRange(item.createdAt, range))
}

export function filterSecurityInRange(
  events: SecurityEvent[],
  range: ReportDateRange,
): SecurityEvent[] {
  return events.filter((event) => isTimestampInRange(event.timestamp, range))
}

const PDF_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export type PeriodComparison = {
  current: number
  previous: number
  delta: number
  deltaPercent: number | null
}

export type MonthlyAggregate = {
  monthKey: string
  signups: number
  events: number
  rsvps: number
  reports: number
  revenueCents: number
  paidTransactions: number
  feedback: number
  securityEvents: number
  activity: number
}

export type AdminReportComparisonMetrics = {
  signups: PeriodComparison
  events: PeriodComparison
  rsvps: PeriodComparison
  avgDau: PeriodComparison
  avgMau: PeriodComparison
  revenueCents: PeriodComparison
  paidTransactions: PeriodComparison
  feedback: PeriodComparison
  securityEvents: PeriodComparison
  activity: PeriodComparison
}

export type AdminReportPeriodAnalysis = {
  currentMonthKey: string
  previousMonthKey: string
  currentMonthLabel: string
  previousMonthLabel: string
  /** Documents how month-over-month comparisons are derived for readers of the PDF. */
  methodologyNote: string
  comparisons: AdminReportComparisonMetrics
}

export function getPreviousMonthKey(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-')
  let year = Number.parseInt(yearStr, 10)
  let month = Number.parseInt(monthStr, 10)
  month -= 1
  if (month < 1) {
    month = 12
    year -= 1
  }
  return `${year}-${String(month).padStart(2, '0')}`
}

export function monthKeyFromDate(isoOrDay: string): string {
  return isoOrDay.slice(0, 7)
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const monthIndex = Number.parseInt(month, 10) - 1
  if (!year || monthIndex < 0 || monthIndex > 11) return monthKey
  return `${PDF_MONTHS[monthIndex]} ${year}`
}

export function computePeriodComparison(current: number, previous: number): PeriodComparison {
  const delta = current - previous
  let deltaPercent: number | null
  if (previous === 0) {
    deltaPercent = current === 0 ? 0 : null
  } else {
    deltaPercent = (delta / previous) * 100
  }
  return { current, previous, delta, deltaPercent }
}

export function aggregateMetricsByMonth(input: {
  chart: ChartPoint[]
  transactions: TicketTransaction[]
  feedback: FeedbackReport[]
  security: SecurityEvent[]
  activity: ActivityLogEntry[]
  eventIds?: Set<string>
}): MonthlyAggregate[] {
  const buckets = new Map<string, MonthlyAggregate>()

  function ensure(monthKey: string): MonthlyAggregate {
    let row = buckets.get(monthKey)
    if (!row) {
      row = {
        monthKey,
        signups: 0,
        events: 0,
        rsvps: 0,
        reports: 0,
        revenueCents: 0,
        paidTransactions: 0,
        feedback: 0,
        securityEvents: 0,
        activity: 0,
      }
      buckets.set(monthKey, row)
    }
    return row
  }

  for (const point of input.chart) {
    const row = ensure(monthKeyFromDate(point.date))
    row.signups += point.signups
    row.events += point.events
    row.rsvps += point.rsvps
    row.reports += point.reports
  }

  for (const txn of input.transactions) {
    if (input.eventIds && !input.eventIds.has(txn.eventId)) continue
    const row = ensure(monthKeyFromDate(txn.timestamp))
    if (txn.status === 'paid' && txn.amountCents > 0) {
      row.paidTransactions += 1
      row.revenueCents += txn.amountCents
    }
  }

  for (const item of input.feedback) {
    ensure(monthKeyFromDate(item.createdAt)).feedback += 1
  }

  for (const event of input.security) {
    ensure(monthKeyFromDate(event.timestamp)).securityEvents += 1
  }

  for (const entry of input.activity) {
    ensure(monthKeyFromDate(entry.timestamp)).activity += 1
  }

  return [...buckets.values()].sort((a, b) => a.monthKey.localeCompare(b.monthKey))
}

function avgDauForMonth(chart: ChartPoint[], monthKey: string): number {
  const points = chart.filter((point) => monthKeyFromDate(point.date) === monthKey)
  if (points.length === 0) return 0
  return Math.round(
    points.reduce((sum, point) => sum + (point.dau ?? 0), 0) / points.length,
  )
}

function avgMauForMonth(chart: ChartPoint[], monthKey: string): number {
  const points = chart.filter((point) => monthKeyFromDate(point.date) === monthKey)
  if (points.length === 0) return 0
  return Math.round(
    points.reduce((sum, point) => sum + (point.mau ?? 0), 0) / points.length,
  )
}

function monthlyMetricValue(
  monthly: MonthlyAggregate[],
  monthKey: string,
  pick: (row: MonthlyAggregate) => number,
): number {
  const row = monthly.find((entry) => entry.monthKey === monthKey)
  return row ? pick(row) : 0
}

function filteredEventIds(filters: AnalyticsFilters): Set<string> {
  return new Set(
    getHostEvents()
      .filter((event) => eventMatchesFilters(event, filters))
      .map((event) => event.id),
  )
}

export function buildAdminReportPeriodAnalysis(
  range: ReportDateRange,
  filters: AnalyticsFilters,
): AdminReportPeriodAnalysis {
  const currentMonthKey = monthKeyFromDate(range.endDate)
  const previousMonthKey = getPreviousMonthKey(currentMonthKey)
  const eventIds = filteredEventIds(filters)
  const chartHistory = getChartData(365, filters)
  const activityHistory = getFilteredActivityLog(filters, {
    excludeNoise: true,
    subject: { kind: 'platform' },
    limit: 5000,
  })
  const monthly = aggregateMetricsByMonth({
    chart: chartHistory,
    transactions: getTicketTransactions(),
    feedback: getFeedbackItems(),
    security: getSecurityEvents(),
    activity: activityHistory,
    eventIds,
  })

  const currentAvgDau = avgDauForMonth(chartHistory, currentMonthKey)
  const previousAvgDau = avgDauForMonth(chartHistory, previousMonthKey)
  const currentAvgMau = avgMauForMonth(chartHistory, currentMonthKey)
  const previousAvgMau = avgMauForMonth(chartHistory, previousMonthKey)

  const currentMonthLabel = formatMonthLabel(currentMonthKey)
  const previousMonthLabel = formatMonthLabel(previousMonthKey)

  return {
    currentMonthKey,
    previousMonthKey,
    currentMonthLabel,
    previousMonthLabel,
    methodologyNote: `Month-over-month table compares ${previousMonthLabel} to ${currentMonthLabel} (calendar months from report end date). Detail sections use selected range ${range.startDate} to ${range.endDate}.`,
    comparisons: {
      signups: computePeriodComparison(
        monthlyMetricValue(monthly, currentMonthKey, (row) => row.signups),
        monthlyMetricValue(monthly, previousMonthKey, (row) => row.signups),
      ),
      events: computePeriodComparison(
        monthlyMetricValue(monthly, currentMonthKey, (row) => row.events),
        monthlyMetricValue(monthly, previousMonthKey, (row) => row.events),
      ),
      rsvps: computePeriodComparison(
        monthlyMetricValue(monthly, currentMonthKey, (row) => row.rsvps),
        monthlyMetricValue(monthly, previousMonthKey, (row) => row.rsvps),
      ),
      avgDau: computePeriodComparison(currentAvgDau, previousAvgDau),
      avgMau: computePeriodComparison(currentAvgMau, previousAvgMau),
      revenueCents: computePeriodComparison(
        monthlyMetricValue(monthly, currentMonthKey, (row) => row.revenueCents),
        monthlyMetricValue(monthly, previousMonthKey, (row) => row.revenueCents),
      ),
      paidTransactions: computePeriodComparison(
        monthlyMetricValue(monthly, currentMonthKey, (row) => row.paidTransactions),
        monthlyMetricValue(monthly, previousMonthKey, (row) => row.paidTransactions),
      ),
      feedback: computePeriodComparison(
        monthlyMetricValue(monthly, currentMonthKey, (row) => row.feedback),
        monthlyMetricValue(monthly, previousMonthKey, (row) => row.feedback),
      ),
      securityEvents: computePeriodComparison(
        monthlyMetricValue(monthly, currentMonthKey, (row) => row.securityEvents),
        monthlyMetricValue(monthly, previousMonthKey, (row) => row.securityEvents),
      ),
      activity: computePeriodComparison(
        monthlyMetricValue(monthly, currentMonthKey, (row) => row.activity),
        monthlyMetricValue(monthly, previousMonthKey, (row) => row.activity),
      ),
    },
  }
}

export type AdminReportPayload = {
  range: ReportDateRange
  filters: AnalyticsFilters
  sections: AdminReportSectionId[]
  generatedAt: string
  periodAnalysis?: AdminReportPeriodAnalysis
  kpis?: ReturnType<typeof getPlatformKPIs>
  chart?: ChartPoint[]
  tiers?: ReturnType<typeof getUsersTierBreakdown>
  engagement?: ReturnType<typeof getCardOpensKPIs> & {
    topKeywords: { keyword: string; count: number }[]
  }
  ticketSales?: ReturnType<typeof getTicketSalesKPIs>
  topTicketEvents?: ReturnType<typeof getTopEventsByTicketSales>
  transactions?: TicketTransaction[]
  activity?: ActivityLogEntry[]
  feedback?: FeedbackReport[]
  security?: SecurityEvent[]
}

export function buildAdminReportPayload(input: {
  range: ReportDateRange
  filters?: AnalyticsFilters
  sections: AdminReportSectionId[]
}): AdminReportPayload {
  const filters = input.filters ?? { country: 'all', province: 'all', city: 'all' }
  const payload: AdminReportPayload = {
    range: input.range,
    filters,
    sections: input.sections,
    generatedAt: new Date().toISOString(),
  }

  if (input.sections.includes('month_over_month')) {
    payload.periodAnalysis = buildAdminReportPeriodAnalysis(input.range, filters)
  }

  const chartDays = Math.min(
    90,
    Math.max(
      7,
      Math.round(
        (new Date(`${input.range.endDate}T12:00:00`).getTime() -
          new Date(`${input.range.startDate}T12:00:00`).getTime()) /
          86400000,
      ) + 1,
    ),
  )

  if (input.sections.includes('analytics_kpis')) {
    payload.kpis = getPlatformKPIs(filters)
  }
  if (input.sections.includes('growth_chart')) {
    payload.chart = chartPointsInRange(getChartData(chartDays, filters), input.range)
  }
  if (input.sections.includes('user_tiers')) {
    payload.tiers = getUsersTierBreakdown(filters)
  }
  if (input.sections.includes('engagement')) {
    payload.engagement = {
      ...getCardOpensKPIs(filters),
      topKeywords: getTopSearchKeywords(10).map((k) => ({
        keyword: k.keyword,
        count: k.views + k.saves,
      })),
    }
  }
  if (input.sections.includes('ticket_sales')) {
    payload.ticketSales = getTicketSalesKPIs(filters)
    payload.topTicketEvents = getTopEventsByTicketSales(filters, 15).filter((row) => {
      // Top events aren't date-scoped in source data — include all with note in PDF
      return row.sold > 0
    })
  }
  if (input.sections.includes('ticket_transactions')) {
    payload.transactions = filterTransactionsInRange(getTicketTransactions(), input.range)
  }
  if (input.sections.includes('activity_log')) {
    payload.activity = getFilteredActivityLog(filters, {
      excludeNoise: true,
      subject: { kind: 'platform' },
      limit: 500,
    }).filter((entry) => isTimestampInRange(entry.timestamp, input.range))
  }
  if (input.sections.includes('feedback')) {
    payload.feedback = filterFeedbackInRange(getFeedbackItems(), input.range)
  }
  if (input.sections.includes('security')) {
    payload.security = filterSecurityInRange(getSecurityEvents(), input.range)
  }

  return payload
}

const PAGE_MARGIN = 14
const CONTENT_WIDTH = 184
const LINE_HEIGHT = 5.5

/** jsPDF standard fonts are Latin-1 — strip/replace Unicode so dates do not render as & between letters. */
const PDF_CHAR_REPLACEMENTS: Record<string, string> = {
  '\u2013': '-',
  '\u2014': '-',
  '\u2212': '-',
  '\u2192': ' to ',
  '\u00b7': ' - ',
  '\u2026': '...',
  '\u2018': "'",
  '\u2019': "'",
  '\u201c': '"',
  '\u201d': '"',
}

function pdfSafeText(text: string | number | null | undefined): string {
  if (text == null) return '-'
  let value = String(text)
  for (const [from, to] of Object.entries(PDF_CHAR_REPLACEMENTS)) {
    value = value.split(from).join(to)
  }
  return value.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
}

function formatPdfDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  if (!year || !month || !day) return pdfSafeText(dateStr)
  const monthIndex = Number.parseInt(month, 10) - 1
  const dayNum = Number.parseInt(day, 10)
  if (monthIndex < 0 || monthIndex > 11 || !Number.isFinite(dayNum)) {
    return pdfSafeText(dateStr)
  }
  return `${PDF_MONTHS[monthIndex]} ${dayNum}, ${year}`
}

function formatPdfDateRange(range: ReportDateRange): string {
  return `${formatPdfDateLabel(range.startDate)} to ${formatPdfDateLabel(range.endDate)}`
}

function formatPdfDateTime(iso: string): string {
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) {
    return pdfSafeText(iso.slice(0, 16).replace('T', ' '))
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const meridiem = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return `${year}-${month}-${day} ${hours}:${minutes} ${meridiem}`
}

const PDF_BRAND = {
  blue: { r: 56, g: 189, b: 248 },
  orange: { r: 249, g: 115, b: 22 },
  accent: { r: 56, g: 189, b: 248 },
  accentSoft: { r: 224, g: 242, b: 254 },
  headerFill: { r: 236, g: 246, b: 252 },
  zebra: { r: 248, g: 250, b: 252 },
  text: { r: 30, g: 30, b: 30 },
  muted: { r: 110, g: 110, b: 110 },
}

const REPORT_LOGO_PATHS = ['/tudu-report-logo.png', '/logo.png']
const REPORT_LOGO_MAX_WIDTH_MM = 80

type ReportLogoImage = {
  dataUrl: string
  widthPx: number
  heightPx: number
  format: 'PNG' | 'JPEG' | 'WEBP'
}

function computeReportLogoDisplaySizeMm(logo: ReportLogoImage): {
  widthMm: number
  heightMm: number
} {
  const widthMm = REPORT_LOGO_MAX_WIDTH_MM
  const heightMm = widthMm * (logo.heightPx / logo.widthPx)
  return { widthMm, heightMm }
}

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load report logo image'))
    img.src = dataUrl
  })
}

/** AI-exported PNGs often bake in a gray/white checkerboard instead of real alpha. */
function isFakeTransparencyPixel(r: number, g: number, b: number): boolean {
  const spread = Math.max(r, g, b) - Math.min(r, g, b)
  if (spread > 28) return false
  return (r + g + b) / 3 >= 192
}

async function stripFakeTransparency(dataUrl: string): Promise<string> {
  const img = await loadImageFromDataUrl(dataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl

  ctx.drawImage(img, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { data } = imageData

  for (let i = 0; i < data.length; i += 4) {
    if (isFakeTransparencyPixel(data[i], data[i + 1], data[i + 2])) {
      data[i + 3] = 0
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

async function loadReportLogoDataUrl(): Promise<ReportLogoImage | null> {
  for (const path of REPORT_LOGO_PATHS) {
    try {
      const response = await fetch(path)
      if (!response.ok) continue
      const blob = await response.blob()
      const dataUrl = await new Promise<string | null>((resolve) => {
        const reader = new FileReader()
        reader.onload = () =>
          resolve(typeof reader.result === 'string' ? reader.result : null)
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(blob)
      })
      if (!dataUrl) continue
      const img = await loadImageFromDataUrl(dataUrl)
      if (img.naturalWidth <= 0 || img.naturalHeight <= 0) continue
      const cleanedDataUrl = await stripFakeTransparency(dataUrl)
      return {
        dataUrl: cleanedDataUrl,
        widthPx: img.naturalWidth,
        heightPx: img.naturalHeight,
        format: 'PNG',
      }
    } catch {
      // try next path
    }
  }
  return null
}

type PdfWriter = {
  doc: jsPDF
  y: number
  page: number
}

function setFill(doc: jsPDF, color: { r: number; g: number; b: number }) {
  doc.setFillColor(color.r, color.g, color.b)
}

function setDraw(doc: jsPDF, color: { r: number; g: number; b: number }) {
  doc.setDrawColor(color.r, color.g, color.b)
}

function setText(doc: jsPDF, color: { r: number; g: number; b: number }) {
  doc.setTextColor(color.r, color.g, color.b)
}

function newWriter(): PdfWriter {
  return { doc: new jsPDF({ unit: 'mm', format: 'letter' }), y: PAGE_MARGIN, page: 1 }
}

function ensureSpace(writer: PdfWriter, needed: number): void {
  const pageHeight = writer.doc.internal.pageSize.getHeight()
  if (writer.y + needed <= pageHeight - PAGE_MARGIN) return
  writer.doc.addPage()
  writer.page += 1
  writer.y = PAGE_MARGIN
}

function addLine(
  writer: PdfWriter,
  text: string,
  opts?: { size?: number; bold?: boolean; color?: { r: number; g: number; b: number } },
) {
  ensureSpace(writer, LINE_HEIGHT + 1)
  writer.doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal')
  writer.doc.setFontSize(opts?.size ?? 10)
  setText(writer.doc, opts?.color ?? PDF_BRAND.text)
  const lines = writer.doc.splitTextToSize(pdfSafeText(text), CONTENT_WIDTH)
  for (const line of lines) {
    ensureSpace(writer, LINE_HEIGHT)
    writer.doc.text(line, PAGE_MARGIN, writer.y)
    writer.y += LINE_HEIGHT
  }
}

function drawDualAccentLine(writer: PdfWriter, y: number, blueWidth = 52, orangeWidth = 18) {
  const { doc } = writer
  setDraw(doc, PDF_BRAND.blue)
  doc.setLineWidth(0.6)
  doc.line(PAGE_MARGIN, y, PAGE_MARGIN + blueWidth, y)
  setDraw(doc, PDF_BRAND.orange)
  doc.line(PAGE_MARGIN + blueWidth + 2, y, PAGE_MARGIN + blueWidth + 2 + orangeWidth, y)
}

function drawKpiRowBackground(writer: PdfWriter, boxHeight: number) {
  setFill(writer.doc, PDF_BRAND.accentSoft)
  writer.doc.roundedRect(PAGE_MARGIN, writer.y - 4.5, CONTENT_WIDTH, boxHeight, 1.5, 1.5, 'F')
  setFill(writer.doc, PDF_BRAND.orange)
  writer.doc.rect(PAGE_MARGIN, writer.y - 4.5, 1.2, boxHeight, 'F')
}

function drawReportCover(
  writer: PdfWriter,
  payload: AdminReportPayload,
  logo?: ReportLogoImage | null,
) {
  const { doc } = writer
  writer.y = PAGE_MARGIN

  if (logo) {
    const { widthMm, heightMm } = computeReportLogoDisplaySizeMm(logo)
    try {
      doc.addImage(logo.dataUrl, logo.format, PAGE_MARGIN, writer.y, widthMm, heightMm)
      writer.y += heightMm + 5
    } catch {
      // skip corrupt logo data
    }
  }

  addLine(writer, 'Control Room Report', { size: 18, bold: true })
  addLine(writer, formatPdfDateRange(payload.range), { size: 12, color: PDF_BRAND.muted })
  addLine(writer, `Generated ${formatPdfDateTime(payload.generatedAt)}`, {
    size: 9,
    color: PDF_BRAND.muted,
  })
  addLine(writer, 'Local browser data (Phase 1 export)', { size: 9, color: PDF_BRAND.muted })

  const sectionLabels = payload.sections.map((section) => section.replace(/_/g, ' ')).join(', ')
  addLine(writer, `Sections: ${sectionLabels}`, { size: 9 })
  if (payload.periodAnalysis) {
    addLine(writer, payload.periodAnalysis.methodologyNote, { size: 8, color: PDF_BRAND.muted })
  }

  writer.y += 2
  drawDualAccentLine(writer, writer.y)
  writer.y += 5
}

function addSectionTitle(writer: PdfWriter, title: string) {
  writer.y += 4
  addLine(writer, title, { size: 13, bold: true })
  drawDualAccentLine(writer, writer.y, 40, 12)
  writer.y += 3
}

function addKeyValueTable(writer: PdfWriter, rows: [string, string][]) {
  const boxHeight = 7
  for (const [label, value] of rows) {
    ensureSpace(writer, boxHeight + 1)
    drawKpiRowBackground(writer, boxHeight)
    writer.doc.setFont('helvetica', 'normal')
    writer.doc.setFontSize(9)
    setText(writer.doc, PDF_BRAND.muted)
    writer.doc.text(pdfSafeText(label), PAGE_MARGIN + 3, writer.y)
    writer.doc.setFont('helvetica', 'bold')
    setText(writer.doc, PDF_BRAND.text)
    writer.doc.text(pdfSafeText(value), PAGE_MARGIN + 72, writer.y)
    writer.y += boxHeight
  }
}

export function formatComparisonValue(value: number, opts?: { isCurrency?: boolean }): string {
  return opts?.isCurrency ? formatCents(value) : String(value)
}

export function formatGrowthCell(comp: PeriodComparison, opts?: { isCurrency?: boolean }): string {
  if (comp.deltaPercent === null) return '—'
  const absDelta = Math.abs(comp.delta)
  const deltaText = opts?.isCurrency
    ? `${comp.delta >= 0 ? '+' : '-'}${formatCents(absDelta)}`
    : `${comp.delta >= 0 ? '+' : ''}${comp.delta}`
  const pctSign = comp.deltaPercent >= 0 ? '+' : ''
  return `${deltaText} (${pctSign}${comp.deltaPercent.toFixed(0)}%)`
}

type ComparisonTableRow = {
  label: string
  comp: PeriodComparison
  isCurrency?: boolean
}

export function buildComparisonTableRows(
  comparisons: AdminReportComparisonMetrics,
): ComparisonTableRow[] {
  return [
    { label: 'Signups', comp: comparisons.signups },
    { label: 'Events published', comp: comparisons.events },
    { label: 'RSVPs / tickets', comp: comparisons.rsvps },
    { label: 'Avg DAU', comp: comparisons.avgDau },
    { label: 'Avg MAU', comp: comparisons.avgMau },
    { label: 'Gross revenue', comp: comparisons.revenueCents, isCurrency: true },
    { label: 'Paid transactions', comp: comparisons.paidTransactions },
    { label: 'Feedback & reports', comp: comparisons.feedback },
    { label: 'Security events', comp: comparisons.securityEvents },
    { label: 'Platform activity', comp: comparisons.activity },
  ]
}

function drawMonthComparisonTable(writer: PdfWriter, analysis: AdminReportPeriodAnalysis) {
  const rows = buildComparisonTableRows(analysis.comparisons)
  addDataTable(
    writer,
    ['Metric', analysis.previousMonthLabel, analysis.currentMonthLabel, 'Growth'],
    rows.map(({ label, comp, isCurrency }) => [
      label,
      formatComparisonValue(comp.previous, { isCurrency }),
      formatComparisonValue(comp.current, { isCurrency }),
      formatGrowthCell(comp, { isCurrency }),
    ]),
    [46, 38, 38, 38],
  )
}

function drawPeriodOverview(writer: PdfWriter, analysis: AdminReportPeriodAnalysis) {
  addSectionTitle(writer, 'Month-over-month overview')
  addLine(writer, analysis.methodologyNote, { size: 8, color: PDF_BRAND.muted })
  drawMonthComparisonTable(writer, analysis)
}

function addDataTable(
  writer: PdfWriter,
  headers: string[],
  rows: string[][],
  colWidths: number[],
) {
  const rowHeight = 6.5
  ensureSpace(writer, rowHeight + 2)

  setFill(writer.doc, PDF_BRAND.headerFill)
  writer.doc.rect(PAGE_MARGIN, writer.y - 4.5, CONTENT_WIDTH, rowHeight, 'F')
  writer.doc.setFont('helvetica', 'bold')
  writer.doc.setFontSize(9)
  setText(writer.doc, PDF_BRAND.text)
  let x = PAGE_MARGIN + 1.5
  headers.forEach((header, index) => {
    writer.doc.text(pdfSafeText(header), x, writer.y)
    x += colWidths[index] ?? 30
  })
  writer.y += rowHeight

  writer.doc.setFont('helvetica', 'normal')
  writer.doc.setFontSize(8)
  rows.forEach((row, rowIndex) => {
    ensureSpace(writer, rowHeight)
    if (rowIndex % 2 === 1) {
      setFill(writer.doc, PDF_BRAND.zebra)
      writer.doc.rect(PAGE_MARGIN, writer.y - 4.5, CONTENT_WIDTH, rowHeight, 'F')
    }
    setText(writer.doc, PDF_BRAND.text)
    x = PAGE_MARGIN + 1.5
    row.forEach((cell, index) => {
      const width = colWidths[index] ?? 30
      const clipped = writer.doc.splitTextToSize(pdfSafeText(cell), width - 2)[0] ?? ''
      writer.doc.text(clipped, x, writer.y)
      x += width
    })
    writer.y += rowHeight
  })
  writer.y += 1
}

function drawGrowthSparkline(writer: PdfWriter, points: ChartPoint[]) {
  if (points.length < 2) return
  const values = points.map((p) => p.signups)
  const max = Math.max(1, ...values)
  const chartTop = writer.y + 2
  const chartHeight = 28
  const chartWidth = 184
  ensureSpace(writer, chartHeight + 8)
  setDraw(writer.doc, PDF_BRAND.muted)
  writer.doc.rect(PAGE_MARGIN, chartTop, chartWidth, chartHeight)
  setDraw(writer.doc, PDF_BRAND.blue)
  const step = chartWidth / (points.length - 1)
  for (let i = 1; i < points.length; i++) {
    const x1 = PAGE_MARGIN + step * (i - 1)
    const x2 = PAGE_MARGIN + step * i
    const y1 = chartTop + chartHeight - (values[i - 1] / max) * (chartHeight - 2)
    const y2 = chartTop + chartHeight - (values[i] / max) * (chartHeight - 2)
    writer.doc.line(x1, y1, x2, y2)
  }
  writer.y = chartTop + chartHeight + 6
  addLine(writer, 'Daily signups (sparkline)', { size: 8 })
}

function eventTitleForId(eventId: string): string {
  return getHostEvents().find((e) => e.id === eventId)?.title ?? eventId
}

export function generateAdminReportPdf(
  payload: AdminReportPayload,
  logo?: ReportLogoImage | null,
): void {
  const writer = newWriter()
  const { doc } = writer

  drawReportCover(writer, payload, logo)

  if (payload.periodAnalysis) {
    drawPeriodOverview(writer, payload.periodAnalysis)
  }

  if (payload.kpis) {
    addSectionTitle(writer, 'Platform KPIs')
    addLine(writer, 'Snapshot totals (all-time in filter).', {
      size: 8,
      color: PDF_BRAND.muted,
    })
    addKeyValueTable(writer, [
      ['Total users', String(payload.kpis.totalUsers)],
      ['MAU', String(payload.kpis.mau)],
      ['DAU', String(payload.kpis.dau)],
      ['Total events', String(payload.kpis.totalEvents)],
      ['Live public events', String(payload.kpis.livePublicEvents)],
      ['Card views', String(payload.kpis.globalViews)],
      ['Saved interest', String(payload.kpis.savedInterest)],
      ['Total RSVPs', String(payload.kpis.totalRsvps)],
      ['Save rate', payload.kpis.saveRate],
      ['RSVP conversion', payload.kpis.rsvpConversionRate],
      ['Signup trend (WoW)', payload.kpis.signupTrendWoW],
    ])
  }

  if (payload.chart) {
    addSectionTitle(writer, 'Growth chart')
    const periodSignups = payload.chart.reduce((sum, point) => sum + point.signups, 0)
    const periodEvents = payload.chart.reduce((sum, point) => sum + point.events, 0)
    const periodRsvps = payload.chart.reduce((sum, point) => sum + point.rsvps, 0)
    addKeyValueTable(writer, [
      ['Signups (range total)', String(periodSignups)],
      ['Events (range total)', String(periodEvents)],
      ['RSVPs (range total)', String(periodRsvps)],
    ])
    drawGrowthSparkline(writer, payload.chart)
    addDataTable(
      writer,
      ['Date', 'Signups', 'Events', 'RSVPs', 'DAU', 'MAU'],
      payload.chart.map((point) => [
        formatPdfDateLabel(point.date),
        String(point.signups),
        String(point.events),
        String(point.rsvps),
        String(point.dau ?? 0),
        String(point.mau ?? 0),
      ]),
      [28, 22, 22, 22, 22, 22],
    )
  }

  if (payload.tiers) {
    addSectionTitle(writer, 'User tiers - personal')
    addDataTable(
      writer,
      ['Tier', 'Count'],
      payload.tiers.personal.map((row) => [row.label, String(row.count)]),
      [80, 30],
    )
    addSectionTitle(writer, 'User tiers - host accounts (orgs)')
    addDataTable(
      writer,
      ['Tier', 'Count'],
      payload.tiers.org.map((row) => [row.label, String(row.count)]),
      [80, 30],
    )
  }

  if (payload.engagement) {
    addSectionTitle(writer, 'Engagement')
    addKeyValueTable(writer, [
      ['Detail opens', String(payload.engagement.totalOpens)],
      ['Saves', String(payload.engagement.totalSaves)],
      ['Card views', String(payload.engagement.totalViews)],
      ['Open rate', payload.engagement.openRate],
      ['Save rate', payload.engagement.saveRate],
      ['Pass rate', payload.engagement.passRate],
    ])
    if (payload.engagement.topKeywords.length > 0) {
      addLine(writer, 'Top search keywords:', { bold: true })
      addDataTable(
        writer,
        ['Keyword', 'Count'],
        payload.engagement.topKeywords.map((k) => [k.keyword, String(k.count)]),
        [100, 30],
      )
    }
  }

  if (payload.ticketSales) {
    addSectionTitle(writer, 'Ticket sales summary')
    addLine(writer, 'All-time totals in filtered set.', {
      size: 8,
      color: PDF_BRAND.muted,
    })
    addKeyValueTable(writer, [
      ['Total RSVPs / sold', String(payload.ticketSales.totalRsvps)],
      ['Paid transactions (all-time)', String(payload.ticketSales.paidTransactions)],
      ['Free checkouts', String(payload.ticketSales.freeCheckouts)],
      ['Gross revenue (all-time)', formatCents(payload.ticketSales.totalRevenueCents)],
      ['Cancelled', String(payload.ticketSales.cancelledCount)],
      ['Avg ticket price', formatCents(payload.ticketSales.avgTicketPriceCents)],
    ])
    if (payload.topTicketEvents && payload.topTicketEvents.length > 0) {
      addLine(writer, 'Top events by ticket sales (all-time in filtered set):', { bold: true })
      addDataTable(
        writer,
        ['Event', 'Sold', 'Revenue'],
        payload.topTicketEvents.map((row) => [
          row.title,
          String(row.sold),
          formatCents(row.revenueCents),
        ]),
        [90, 25, 35],
      )
    }
  }

  if (payload.transactions) {
    addSectionTitle(writer, 'Ticket transactions')
    addLine(writer, `${payload.transactions.length} transaction(s) in date range`)
    if (payload.transactions.length === 0) {
      addLine(writer, 'No ticket transactions in this period.')
    } else {
      addDataTable(
        writer,
        ['Transaction ID', 'Date', 'Event', 'Tier', 'Amount', 'Status'],
        payload.transactions.map((txn) => [
          txn.id,
          formatPdfDateTime(txn.timestamp),
          eventTitleForId(txn.eventId),
          txn.tierName,
          formatCents(txn.amountCents),
          txn.status,
        ]),
        [38, 28, 48, 28, 22, 20],
      )
    }
  }

  if (payload.activity) {
    addSectionTitle(writer, 'Platform activity log')
    addLine(
      writer,
      `${payload.activity.length} event(s) in date range (sign-ins excluded).`,
    )
    if (payload.activity.length === 0) {
      addLine(writer, 'No platform activity in this period.')
    } else {
      addDataTable(
        writer,
        ['When', 'Type', 'Label'],
        payload.activity.map((entry) => [
          formatPdfDateTime(entry.timestamp),
          entry.type,
          entry.label,
        ]),
        [32, 32, 120],
      )
    }
  }

  if (payload.feedback) {
    addSectionTitle(writer, 'Feedback & reports')
    const openCount = payload.feedback.filter((item) => item.status === 'open').length
    const reportCount = payload.feedback.filter((item) => item.type === 'report').length
    addKeyValueTable(writer, [
      ['Total in range', String(payload.feedback.length)],
      ['Still open', String(openCount)],
      ['Resolved', String(payload.feedback.length - openCount)],
      ['Event reports', String(reportCount)],
      ['General feedback', String(payload.feedback.length - reportCount)],
    ])
    if (payload.feedback.length === 0) {
      addLine(writer, 'No feedback or reports in this period.')
    } else {
      addDataTable(
        writer,
        ['Ticket', 'Date', 'Type', 'Status', 'Reason', 'Reporter'],
        payload.feedback.map((item) => [
          item.ticketNumber,
          formatPdfDateTime(item.createdAt),
          item.type,
          getFeedbackStatusLabel(item.status),
          item.reason,
          item.reporterEmail ?? '-',
        ]),
        [28, 28, 22, 24, 42, 40],
      )
    }
  }

  if (payload.security) {
    addSectionTitle(writer, 'Security events')
    const criticalCount = payload.security.filter(
      (event) => event.severity === 'critical' || event.severity === 'high',
    ).length
    addKeyValueTable(writer, [
      ['Total in range', String(payload.security.length)],
      ['High / critical', String(criticalCount)],
    ])
    if (payload.security.length === 0) {
      addLine(writer, 'No security events in this period.')
    } else {
      addDataTable(
        writer,
        ['Ticket', 'Date', 'Type', 'Severity', 'User', 'Details'],
        payload.security.map((event) => [
          event.ticketNumber,
          formatPdfDateTime(event.timestamp),
          event.eventType,
          event.severity,
          event.user,
          event.details ?? '-',
        ]),
        [28, 28, 26, 22, 38, 42],
      )
    }
  }

  const pageCount = doc.getNumberOfPages()
  const footerRange = formatPdfDateRange(payload.range)
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setText(doc, PDF_BRAND.muted)
    doc.text(
      pdfSafeText(`TUDU Report - ${footerRange} - Page ${i} of ${pageCount}`),
      PAGE_MARGIN,
      doc.internal.pageSize.getHeight() - 8,
    )
  }

  setText(doc, PDF_BRAND.text)

  const filename = `tudu-report_${payload.range.startDate}_${payload.range.endDate}.pdf`
  doc.save(filename)
}

export async function exportAdminReportPdf(input: {
  range: ReportDateRange
  filters?: AnalyticsFilters
  sections: AdminReportSectionId[]
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.sections.length) {
    return { ok: false, error: 'Select at least one section to export.' }
  }
  if (input.range.startDate > input.range.endDate) {
    return { ok: false, error: 'Start date must be on or before end date.' }
  }
  const payload = buildAdminReportPayload(input)
  const logo = await loadReportLogoDataUrl()
  generateAdminReportPdf(payload, logo)
  return { ok: true }
}
