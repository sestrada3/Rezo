import { T } from '../tokens.js'
import {
  Airplane, Buildings, ForkKnife, MusicNotes,
  SoccerBall, MaskHappy, Car, Tag,
} from '@phosphor-icons/react'

const CAT_ICONS = {
  flight: Airplane, hotel: Buildings, dining: ForkKnife,
  concert: MusicNotes, sports: SoccerBall, theater: MaskHappy,
  car: Car, other: Tag,
}

export default function HeroCard({ booking, onClick }) {
  const cat = T.cat[booking.type] || T.cat.other
  const CatIcon = CAT_ICONS[booking.type] || Tag

  return (
    <div onClick={onClick} style={{
      borderRadius: 16,
      background: `linear-gradient(140deg, ${cat.g1} 0%, ${cat.g2} 100%)`,
      padding: '20px', cursor: 'pointer',
      position: 'relative', overflow: 'hidden',
      animation: 'fadeIn 0.3s ease both',
      WebkitTapHighlightColor: 'transparent',
    }}>
      {/* Subtle noise texture circles */}
      <div style={{ position: 'absolute', right: -32, top: -32, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 48, bottom: -48, width: 96, height: 96, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

      {/* NEXT UP label + icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <CatIcon size={14} color="rgba(255,255,255,0.6)" weight="regular" />
        <span style={{ ...T.font.label, color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>NEXT UP · {cat.label}</span>
      </div>

      <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.3px', marginBottom: 4 }}>
        {booking.title}
      </div>
      <div style={{ ...T.font.cardSub, color: 'rgba(255,255,255,0.75)', marginBottom: 16 }}>
        {booking.subtitle}
      </div>

      {/* Date/time pill */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '6px 12px',
        backdropFilter: 'blur(8px)',
      }}>
        <span style={{ ...T.font.mono, color: 'rgba(255,255,255,0.9)' }}>{booking.date}</span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>·</span>
        <span style={{ ...T.font.mono, color: 'rgba(255,255,255,0.9)' }}>{booking.time}</span>
      </div>
    </div>
  )
}
