import { useState } from 'react'
import { T } from '../tokens.js'
import StatusBadge from './StatusBadge.jsx'
import {
  Airplane, Buildings, ForkKnife, MusicNotes,
  SoccerBall, MaskHappy, Car, Tag,
} from '@phosphor-icons/react'

const CAT_ICONS = {
  flight: Airplane, hotel: Buildings, dining: ForkKnife,
  concert: MusicNotes, sports: SoccerBall, theater: MaskHappy,
  car: Car, other: Tag,
}

export default function BookingCard({ booking, isToday = false, isPast = false, onClick }) {
  const [hov, setHov] = useState(false)
  const cat = T.cat[booking.type] || T.cat.other
  const CatIcon = CAT_ICONS[booking.type] || Tag

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px',
        borderRadius: T.space.cardRadius,
        background: hov ? T.color.s2 : T.color.s1,
        borderLeft: isToday ? `3px solid ${T.color.brand}` : '3px solid transparent',
        cursor: 'pointer',
        opacity: isPast ? 0.45 : 1,
        transition: `background 0.18s ${T.ease.std}`,
        animation: 'fadeIn 0.22s ease both',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
      }}
    >
      {/* Category icon */}
      <div style={{
        width: T.space.iconTile, height: T.space.iconTile,
        borderRadius: T.space.iconRadius,
        background: cat.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <CatIcon size={18} color={cat.fg} weight="regular" />
      </div>

      {/* Text — left side */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...T.font.cardHead, color: T.color.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {booking.title}
        </div>
        <div style={{ ...T.font.cardSub, color: T.color.sub, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {booking.subtitle}
        </div>
      </div>

      {/* Right — time + status */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
        <div style={{ ...T.font.mono, color: T.color.sub }}>{booking.time}</div>
        <StatusBadge status={booking.status} />
      </div>
    </div>
  )
}
