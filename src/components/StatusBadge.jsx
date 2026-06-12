import { T } from '../tokens.js'

export default function StatusBadge({ status = 'confirmed' }) {
  const s = T.status[status] || T.status.confirmed
  return (
    <span style={{
      ...T.font.badge,
      background: s.bg, color: s.fg,
      padding: '3px 8px', borderRadius: 6,
      display: 'inline-block', whiteSpace: 'nowrap',
      lineHeight: 1.6,
    }}>
      {s.label}
    </span>
  )
}
