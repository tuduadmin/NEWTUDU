export type TuduanId = 'explorer' | 'connector' | 'host'

export const TUDUANS: Record<
  TuduanId,
  { name: string; title: string; color: string; motifEmoji: string }
> = {
  explorer: {
    name: 'Explorer',
    title: 'Discovery streak',
    color: '#F97316',
    motifEmoji: '🧭',
  },
  connector: {
    name: 'Connector',
    title: 'Community builder',
    color: '#C026A0',
    motifEmoji: '🤝',
  },
  host: {
    name: 'Host',
    title: 'Event creator',
    color: '#38BDF8',
    motifEmoji: '🎟',
  },
}
