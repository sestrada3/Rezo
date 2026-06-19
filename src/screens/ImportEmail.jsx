import { useState } from 'react'
import { T } from '../tokens.js'
import { X, Check } from '@phosphor-icons/react'
import BookingCard from '../components/BookingCard.jsx'
import { parseAndSaveEmail } from '../lib/bookings.js'
import { useStore } from '../store.js'

const PLACEHOLDER = `Paste the full text of any confirmation email:

✈️  Flights — Delta, United, AA, Southwest, JetBlue
🏨  Hotels — Marriott, Hilton, Airbnb, Booking.com
🍽️  Dining — OpenTable, Resy, Tock
🎵  Concerts — Ticketmaster, SeatGeek, StubHub
🏆  Sports — AXS, Ticketmaster
🎭  Theater — TodayTix, Telecharge
🚗  Cars — Hertz, Avis, Enterprise`

export default function ImportEmail({ onClose, userId }) {
  const [text, setText]         = useState('')
  const [state, setState]       = useState('idle')
  const [preview, setPreview]   = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const addBooking = useStore(s => s.addBooking)

  const handleParse = async () => {
    if (!text.trim()) return
    setState('parsing'); setPreview(null); setErrorMsg('')
    try {
      // One email can hold multiple reservations (e.g. round-trip flight legs).
      const bookings = await parseAndSaveEmail(text, userId)
      setPreview(bookings); setState('success')
    } catch (err) {
      setErrorMsg(err.message === 'not_a_booking'
        ? "This doesn't look like a booking confirmation."
        : `Something went wrong: ${err.message}`)
      setState('error')
    }
  }

  const handleAdd = () => { if (preview?.length) { preview.forEach(addBooking); onClose() } }
  const handleReset = () => { setText(''); setState('idle'); setPreview(null); setErrorMsg('') }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 430,
        background: T.color.s1,
        borderRadius: '20px 20px 0 0',
        maxHeight: '90dvh', display: 'flex', flexDirection: 'column',
        animation: 'slideUp 0.25s ease both',
        overflow: 'hidden',
        border: `1px solid ${T.color.sep}`,
        borderBottom: 'none',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.color.s3 }} />
        </div>

        {/* Header */}
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ ...T.font.cardHead, color: T.color.text, fontSize: 16 }}>Import confirmation</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <X size={18} color={T.color.sub} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 8px' }}>
          {state === 'success' && preview?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)',
              }}>
                <Check size={14} color="#4ADE80" weight="bold" />
                <span style={{ ...T.font.cardSub, color: '#4ADE80', fontWeight: 500 }}>
                  {preview.length === 1 ? 'Booking found' : `${preview.length} bookings found`}
                </span>
              </div>
              {preview.map((b, i) => <BookingCard key={b.id ?? i} booking={b} onClick={() => {}} />)}
            </div>
          ) : (
            <textarea
              value={text}
              onChange={e => { setText(e.target.value); if (state !== 'idle') setState('idle') }}
              placeholder={PLACEHOLDER}
              style={{
                width: '100%', minHeight: 200,
                fontFamily: 'Inter, sans-serif', fontSize: 13,
                color: T.color.text, lineHeight: 1.6,
                border: `1px solid ${state === 'error' ? 'rgba(248,113,113,0.4)' : T.color.sep}`,
                borderRadius: 10, padding: '12px 14px',
                resize: 'vertical', outline: 'none',
                background: T.color.s2,
              }}
            />
          )}
          {state === 'error' && (
            <div style={{ marginTop: 8, ...T.font.cardMeta, color: T.color.danger, lineHeight: 1.5 }}>{errorMsg}</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px 32px', borderTop: `1px solid ${T.color.sep}`, display: 'flex', gap: 10 }}>
          {state === 'success' ? (
            <>
              <button onClick={handleReset} style={{
                flex: 1, padding: '12px', borderRadius: 10,
                background: T.color.s2, border: `1px solid ${T.color.sep}`,
                fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: T.color.sub, cursor: 'pointer',
              }}>
                Import another
              </button>
              <button onClick={handleAdd} style={{
                flex: 2, padding: '12px', borderRadius: 10,
                background: T.color.brand, color: T.color.s0, border: 'none',
                fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.2px',
              }}>
                Add to timeline
              </button>
            </>
          ) : (
            <button onClick={handleParse} disabled={!text.trim() || state === 'parsing'} style={{
              flex: 1, padding: '14px', borderRadius: 10,
              background: text.trim() && state !== 'parsing' ? T.color.brand : T.color.s2,
              color: text.trim() && state !== 'parsing' ? T.color.s0 : T.color.ghost,
              border: 'none', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700,
              cursor: text.trim() && state !== 'parsing' ? 'pointer' : 'not-allowed',
              transition: `all 0.18s ${T.ease.std}`, letterSpacing: '-0.2px',
            }}>
              {state === 'parsing' ? 'Parsing…' : 'Parse booking'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
