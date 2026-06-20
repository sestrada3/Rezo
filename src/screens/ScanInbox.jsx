import { useState, useEffect, useRef } from 'react'
import { T } from '../tokens.js'
import { X, Warning } from '@phosphor-icons/react'
import { listConfirmationEmails, getEmailText } from '../lib/gmail.js'
import { parseEmail, saveBookings, loadBookings, getScannedEmailIds, markEmailsScanned } from '../lib/bookings.js'
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
  const [errorStage, setErrorStage] = useState('scan') // scan | save
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
      const [messages, alreadyScanned] = await Promise.all([
        listConfirmationEmails(accessToken, 500),
        getScannedEmailIds(userId),
      ])
      const newMessages = messages.filter(m => m?.id && !alreadyScanned.has(m.id))
      if (!newMessages.length) { setPhase('done'); return }

      setTotal(newMessages.length)
      setPhase('parsing')
      const scannedThisRun = []

      for (let i = 0; i < newMessages.length; i += BATCH) {
        if (cancelRef.current) break
        const batch = newMessages.slice(i, i + BATCH)

        try {
          await Promise.all(batch.map(async (msg) => {
            const id = msg.id
            let subject = null
            try {
              const got = await getEmailText(accessToken, id)
              subject = got.subject
              const { text } = got
              if (!text || cancelRef.current) { scannedThisRun.push(id); return }

              // Parse only — nothing is persisted until the user confirms.
              // One email can hold multiple distinct reservations (e.g. the
              // outbound and return legs of a round-trip itinerary).
              const parsed = await parseEmail(text)
              if (parsed.length && !cancelRef.current) {
                setFound(prev => {
                  let next = prev
                  for (const booking of parsed) {
                    // Dedupe on conf+date (not conf alone — separate legs of
                    // one itinerary often share a single confirmation number).
                    const key = `${booking.conf || booking.title}|${booking.dateISO}`
                    const isDupe = next.some(b => `${b.conf || b.title}|${b.dateISO}` === key)
                    if (!isDupe) next = [...next, booking]
                  }
                  return next
                })
              }
              scannedThisRun.push(id)
            } catch (err) {
              console.warn('[rezo scan] skipped email', { messageId: id, subject, error: err.message })
              // Don't record as scanned — a transient error (network, parse
              // API, etc.) shouldn't permanently hide this email from future
              // scans the way a genuine "not a booking" result should.
            } finally {
              if (!cancelRef.current) setProcessed(p => p + 1)
            }
          }))
        } catch {
          // a whole batch failed unexpectedly (e.g. malformed entry) — keep
          // whatever was already found and move on to the next batch
        }
      }

      // Record every processed message ID — including ones that errored or
      // weren't a booking — so the next scan doesn't pay to re-parse them.
      markEmailsScanned(userId, scannedThisRun).catch(err =>
        console.warn('[rezo scan] failed to record scanned emails', err.message)
      )

      setPhase('done')
    } catch (err) {
      setErrorStage('scan')
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
      setErrorStage('save')
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
            {phase === 'error'    && (errorStage === 'save' ? 'Couldn’t save' : 'Scan failed')}
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
