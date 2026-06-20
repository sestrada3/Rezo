import { T } from '../tokens.js'
import { MapPin } from '@phosphor-icons/react'

export default function TripHeader({ label, dateRange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', marginBottom: 8 }}>
      <MapPin size={13} color={T.color.brand} weight="fill" />
      <span style={{ ...T.font.cardHead, fontSize: 15, color: T.color.text }}>
        {label ?? 'Trip'}
      </span>
      <span style={{ ...T.font.cardMeta, color: T.color.ghost }}>· {dateRange}</span>
      <div style={{ flex: 1, height: 1, background: T.color.sep }} />
    </div>
  )
}
