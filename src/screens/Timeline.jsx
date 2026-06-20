import { useStore } from '../store.js'
import { T } from '../tokens.js'
import BookingCard from '../components/BookingCard.jsx'
import HeroCard from '../components/HeroCard.jsx'
import CategoryChip from '../components/CategoryChip.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import TripHeader from '../components/TripHeader.jsx'
import { groupIntoTrips } from '../lib/trips.js'
import { BellSimple } from '@phosphor-icons/react'

const CHIPS = [
  { label: 'All',      value: 'all'     },
  { label: 'Flights',  value: 'flight'  },
  { label: 'Hotels',   value: 'hotel'   },
  { label: 'Dining',   value: 'dining'  },
  { label: 'Concerts', value: 'concert' },
  { label: 'Sports',   value: 'sports'  },
  { label: 'Shows',    value: 'theater' },
  { label: 'Cars',     value: 'car'     },
]

function dayLabel(isoDate) {
  if (!isoDate) return ''
  const d = new Date(isoDate + 'T00:00:00')
  const days = ['SUN','MON','TUE','WED','THU','FRI','SAT']
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  return `${days[d.getDay()]} · ${months[d.getMonth()]} ${d.getDate()}`
}

export default function Timeline() {
  const { bookings, activeFilter, setFilter, select, user } = useStore()
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  const filtered = activeFilter === 'all'
    ? bookings
    : bookings.filter(b => b.type === activeFilter)

  const nextUp = bookings.find(b => b.status !== 'cancelled')
  const sections = groupIntoTrips(filtered)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.color.s0 }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          {/* Wordmark */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: T.color.brand, fontFamily: 'Inter, sans-serif', letterSpacing: '-1px' }}>re</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: T.color.sub,   fontFamily: 'Inter, sans-serif', letterSpacing: '-1px' }}>zo</span>
          </div>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: T.color.brandDim, border: `1px solid ${T.color.brandBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <BellSimple size={16} color={T.color.brand} weight="regular" />
          </div>
        </div>
        <div style={{ ...T.font.cardMeta, color: T.color.ghost }}>Good to see you, {firstName}</div>
        <div style={{ ...T.font.screenTitle, color: T.color.text, marginTop: 2 }}>
          {bookings.length} {bookings.length === 1 ? 'reservation' : 'reservations'} ahead
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {nextUp && <HeroCard booking={nextUp} onClick={() => select(nextUp.id)} />}

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {CHIPS.map(c => (
            <CategoryChip key={c.value} label={c.label} active={activeFilter === c.value} onClick={() => setFilter(c.value)} />
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ ...T.font.cardSub, color: T.color.ghost, textAlign: 'center', padding: '32px 0' }}>
            No bookings in this category
          </div>
        ) : (
          sections.map(section => (
            <div key={section.key}>
              {section.kind === 'trip' && (
                <TripHeader label={section.label} dateRange={section.dateRange} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {section.days.map(day => (
                  <div key={day.dateISO}>
                    <SectionHeader label={dayLabel(day.dateISO)} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: T.space.cardGap }}>
                      {day.items.map(b => (
                        <BookingCard key={b.id} booking={b} isToday={b.status === 'today'} onClick={() => select(b.id)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        <div style={{ height: 8 }} />
      </div>
    </div>
  )
}
