import { useState } from 'react'
import { useStore } from '../store.js'
import { T } from '../tokens.js'
import BookingCard from '../components/BookingCard.jsx'
import {
  MagnifyingGlass, X,
  Airplane, Buildings, ForkKnife, MusicNotes, SoccerBall, MaskHappy, Car,
} from '@phosphor-icons/react'

const SUGGESTIONS = [
  { label: 'Flights',  type: 'flight',  Icon: Airplane    },
  { label: 'Hotels',   type: 'hotel',   Icon: Buildings   },
  { label: 'Dining',   type: 'dining',  Icon: ForkKnife   },
  { label: 'Concerts', type: 'concert', Icon: MusicNotes  },
  { label: 'Sports',   type: 'sports',  Icon: SoccerBall  },
  { label: 'Theater',  type: 'theater', Icon: MaskHappy   },
  { label: 'Cars',     type: 'car',     Icon: Car         },
]

export default function Search() {
  const { bookings, select } = useStore()
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const results = q
    ? bookings.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.subtitle.toLowerCase().includes(q) ||
        b.conf?.toLowerCase().includes(q) ||
        (b.details?.artist ?? '').toLowerCase().includes(q) ||
        (b.details?.venue ?? '').toLowerCase().includes(q) ||
        (b.details?.restaurant ?? '').toLowerCase().includes(q) ||
        (b.details?.property ?? '').toLowerCase().includes(q)
      )
    : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.color.s0 }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 12px', flexShrink: 0 }}>
        <div style={{ ...T.font.screenTitle, color: T.color.text, marginBottom: 14 }}>Search</div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: T.color.s1, borderRadius: 12,
          padding: '0 14px', border: `1px solid ${T.color.sep}`,
        }}>
          <MagnifyingGlass size={16} color={T.color.ghost} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Venues, flights, conf #..."
            style={{
              flex: 1, border: 'none', background: 'none', outline: 'none',
              fontFamily: 'Inter, sans-serif', fontSize: 15, color: T.color.text,
              padding: '12px 0',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
              <X size={14} color={T.color.ghost} />
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>
        {!q ? (
          <div>
            <div style={{ ...T.font.label, color: T.color.ghost, marginBottom: 12 }}>Browse by type</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {SUGGESTIONS.map(({ label, type, Icon }) => {
                const cat = T.cat[type]
                const count = bookings.filter(b => b.type === type).length
                return (
                  <button key={type} onClick={() => setQuery(label)} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px', borderRadius: 14,
                    background: T.color.s1, border: `1px solid ${T.color.sep}`,
                    cursor: 'pointer', outline: 'none', textAlign: 'left',
                    WebkitTapHighlightColor: 'transparent',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9, background: cat.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon size={16} color={cat.fg} weight="regular" />
                    </div>
                    <div>
                      <div style={{ ...T.font.cardSub, color: T.color.text, fontWeight: 500 }}>{label}</div>
                      <div style={{ ...T.font.cardMeta, color: T.color.ghost }}>{count} booking{count !== 1 ? 's' : ''}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ ...T.font.cardHead, color: T.color.text, marginBottom: 6 }}>No results</div>
            <div style={{ ...T.font.cardSub, color: T.color.ghost }}>Try a venue, artist, city, or conf #</div>
          </div>
        ) : (
          <div>
            <div style={{ ...T.font.label, color: T.color.ghost, marginBottom: 12 }}>{results.length} result{results.length !== 1 ? 's' : ''}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: T.space.cardGap }}>
              {results.map(b => <BookingCard key={b.id} booking={b} isToday={b.status === 'today'} onClick={() => select(b.id)} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
