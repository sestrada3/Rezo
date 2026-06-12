import { T } from '../tokens.js'

export default function ShimmerCard() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px', borderRadius: T.space.cardRadius,
      background: T.color.s1, overflow: 'hidden', position: 'relative',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)`,
        animation: 'shimmer 1.8s ease infinite', zIndex: 1,
      }} />
      <div style={{ width: 38, height: 38, borderRadius: 10, background: T.color.s2, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 10, width: '65%', background: T.color.s2, borderRadius: 4 }} />
        <div style={{ height: 12, width: '45%', background: T.color.s3, borderRadius: 4 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7 }}>
        <div style={{ height: 11, width: 40, background: T.color.s2, borderRadius: 4 }} />
        <div style={{ height: 20, width: 62, background: T.color.s2, borderRadius: 6 }} />
      </div>
    </div>
  )
}
