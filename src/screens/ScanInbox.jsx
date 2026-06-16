import { useState, useEffect, useRef } from 'react'
import { T } from '../tokens.js'
import { X, Warning } from '@phosphor-icons/react'
import { listConfirmationEmails, getEmailText } from '../lib/gmail.js'
import { parseEmail, saveBookings, loadBookings } from '../lib/bookings.js'
import { useStore } from '../store.js'
import BookingCard from '../components/BookingCard.jsx'

const BATCH = 3

export default function ScanInbox({ onClose, accessToken, userId }) {
  const [phase, setPhase]           = useState('scanning') // scanning | parsing | done | error
  const [total, setTotal]           = useState(0)
  const [processed, setProcessed]   = useState(0)
  const [found, setFound]           = useState([])
  const [saving, setSaving]         = useState(false)
  const [errorMsg, setErrorMsg]     = useState('')
  const setBookings = useStore(s => s.setBookings)
  const cancelRef   = useRef(false)

  useEffect(() => {
    cancelRef.current = false
    run()
    return () => { cancelRef.current = true }
  }, [])

  async function run() {
    try {
      setPhase('scanning')
      const messages = await listConfirmationEmails(accessToken, 500)
      if (!messages.length) { setPhase('done'); return }

      setTotal(messages.length)
      setPhase('parsing')

      for (let i = 0; i < messages.length; i += BATCH) {
        if (cancelRef.current) break
        const batch = messages.slice(i, i + BATCH)

        await Promise.all(batch.map(async ({ id }) => {
          try {
            const text = await getEmailText(accessToken, id)
            if (!text || cancelRef.current) return

            // Parse only — nothing is persisted until the user confirms.
            const booking = await parseEmail(text)
            if (booking && !cancelRef.current) {
              setFound(prev => {
                // Deduplicate by conf number or by title+date
                const key = booking.conf || `${booking.title}|${booking.dateISO}`
                const isDupe = prev.some(b =>
                  (b.conf && b.conf === booking.conf) ||
                  (!b.conf && `${b.title}|${b.dateISO}` === key)
                )
                return isDupe ? prev : [...prev, booking]
              })
            }
          } catch {
            // skip unparseable or non-booking emails silently
          } finally {
            if (!cancelRef.current) setProcessed(p => p + 1)
          }
        }))
      }

      setPhase('done')
    } catch (err) {
      setErrorMsg(err.message.includes('401') || err.message.includes('403')
        ? 'Gmail access expired. Sign out and sign back in to reconnect.'
        : `Scan failed: ${err.message}`)
      setPhase('error')
    }
  }

  const handleAddAll = async () => {
    if (saving) return
    setSaving(true)
    try {
      await saveBookings(found, userId)
      const all = await loadBookings(userId)
      setBookings(all)
      onClose()
    } catch (err) {
      setErrorMsg(`Couldn't save reservations: ${err.message}`)
      setPhase('error')
      setSaving(false)
    }
  }

  const progress = total > 0 ? Math.round((processed / total) * 100) : 0

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 430, maxHeight: '90dvh',
        background: T.color.s1, borderRadius: '20px 20px 0 0',
        display: 'flex', flexDirection: 'column',
        border: `1px solid ${T.color.sep}`, borderBottom: 'none',
        animation: 'slideUp 0.25s ease both', overflow: 'hidden',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.color.s3 }} />
        </div>

        {/* Header */}
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ ...T.font.cardHead, color: T.color.text, fontSize: 16 }}>
            {phase === 'scanning' && 'Searching inbox…'}
            {phase === 'parsing'  && 'Reading emails…'}
            {phase === 'done'     && (found.length ? `Found ${found.length} reservation${found.length !== 1 ? 's' : ''}` : 'Nothing new found')}
            {phase === 'error'    && 'Scan failed'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <X size={18} color={T.color.sub} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 8px' }}>

          {/* Progress bar */}
          {(phase === 'scanning' || phase === 'parsing') && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ height: 4, background: T.color.s3, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  background: T.color.brand,
                  width: phase === 'scanning' ? '15%' : `${Math.max(progress, 4)}%`,
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <div style={{ ...T.font.cardMeta, color: T.color.ghost, marginTop: 8 }}>
                {phase === 'scanning' && 'Searching for confirmation emails…'}
                {phase === 'parsing'  && `Checked ${processed} of ${total} emails · ${found.length} reservations found so far`}
              </div>
            </div>
          )}

          {/* Error */}
          {phase === 'error' && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px', borderRadius: 12, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
              <Warning size={16} color={T.color.danger} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ ...T.font.cardMeta, color: T.color.danger, lineHeight: 1.5 }}>{errorMsg}</div>
            </div>
          )}

          {/* Done + empty */}
          {phase === 'done' && found.length === 0 && (
            <div style={{ ...T.font.cardSub, color: T.color.sub, textAlign: 'center', padding: '24px 0' }}>
              No new reservations found in the last 2 years.
            </div>
          )}

          {/* Results */}
          {found.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: T.space.cardGap }}>
              {found.map((b, i) => (
                <BookingCard key={b.id ?? i} booking={b} onClick={() => {}} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {(phase === 'done' || phase === 'error') && (
          <div style={{ padding: '12px 20px 32px', borderTop: `1px solid ${T.color.sep}`, display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '12px', borderRadius: 10,
              background: T.color.s2, border: `1px solid ${T.color.sep}`,
              fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
              color: T.color.sub, cursor: 'pointer',
            }}>
              {found.length ? 'Skip' : 'Close'}
            </button>
            {found.length > 0 && (
              <button onClick={handleAddAll} disabled={saving} style={{
                flex: 2, padding: '12px', borderRadius: 10,
                background: T.color.brand, color: T.color.s0, border: 'none',
                fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: '-0.2px',
                opacity: saving ? 0.6 : 1,
              }}>
                {saving ? 'Saving…' : `Add ${found.length} to timeline`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
