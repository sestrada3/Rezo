import { T } from '../tokens.js'

export default function SectionHeader({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', marginBottom: 8 }}>
      <span style={{ ...T.font.label, color: T.color.ghost, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: T.color.sep }} />
    </div>
  )
}
