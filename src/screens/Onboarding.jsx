import { useState } from 'react'
import { useStore } from '../store.js'
import { T } from '../tokens.js'
import { Check } from '@phosphor-icons/react'
import ShimmerCard from '../components/ShimmerCard.jsx'
import BookingCard from '../components/BookingCard.jsx'
import { DEMO_BOOKINGS } from '../store.js'

function Step1({ onNext }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '48px 28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, marginBottom: 'auto' }}>
        <span style={{ fontSize: 36, fontWeight: 800, color: T.color.brand, fontFamily: 'Inter, sans-serif', letterSpacing: '-1.5px' }}>re</span>
        <span style={{ fontSize: 36, fontWeight: 800, color: T.color.sub,   fontFamily: 'Inter, sans-serif', letterSpacing: '-1.5px' }}>zo</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28 }}>
        <div style={{ ...T.font.display, color: T.color.text, lineHeight: 1.15 }}>
          Everything you've booked.<br />Right here.
        </div>
        <div style={{ ...T.font.body, color: T.color.sub, lineHeight: 1.7, fontSize: 14 }}>
          Rezo reads your confirmation emails and organizes every flight, hotel, restaurant, show, and more into one timeline. No manual entry. No switching apps.
        </div>
      </div>
      <button onClick={onNext} style={{
        width: '100%', padding: '15px', borderRadius: 12,
        background: T.color.brand, color: T.color.s0, border: 'none',
        fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700,
        cursor: 'pointer', letterSpacing: '-0.2px',
        WebkitTapHighlightColor: 'transparent',
      }}>
        Get started
      </button>
    </div>
  )
}

function Step2({ onNext }) {
  const { linkedAccounts, toggleLinked } = useStore()
  const services = [
    { id: 'gmail',   label: 'Gmail',       emoji: '📧', desc: 'google.com / gmail.com' },
    { id: 'outlook', label: 'Outlook',     emoji: '📨', desc: 'outlook.com / hotmail.com' },
    { id: 'apple',   label: 'Apple Mail',  emoji: '✉️', desc: 'icloud.com / me.com' },
  ]
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 28px 32px' }}>
      <div style={{ ...T.font.label, color: T.color.ghost, marginBottom: 10 }}>STEP 1 OF 2</div>
      <div style={{ ...T.font.screenTitle, color: T.color.text, marginBottom: 6 }}>Connect your email</div>
      <div style={{ ...T.font.body, color: T.color.sub, marginBottom: 28, lineHeight: 1.6, fontSize: 13 }}>
        We only scan for confirmation emails. We never read anything else.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {services.map(s => {
          const linked = linkedAccounts.has(s.id)
          return (
            <div key={s.id} onClick={() => toggleLinked(s.id)} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '16px',
              borderRadius: 14,
              border: `1px solid ${linked ? 'rgba(74,222,128,0.3)' : T.color.sep}`,
              background: linked ? 'rgba(74,222,128,0.07)' : T.color.s1,
              cursor: 'pointer', transition: `all 0.18s ${T.ease.std}`,
              WebkitTapHighlightColor: 'transparent',
            }}>
              <span style={{ fontSize: 26 }}>{s.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ ...T.font.cardSub, color: T.color.text, fontWeight: 500 }}>{s.label}</div>
                <div style={{ ...T.font.cardMeta, color: T.color.ghost, marginTop: 2 }}>{s.desc}</div>
              </div>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: linked ? '#4ADE80' : T.color.s3,
                border: `1px solid ${linked ? '#4ADE80' : T.color.sep}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                transition: `all 0.18s ${T.ease.std}`,
              }}>
                {linked && <Check size={12} color={T.color.s0} weight="bold" />}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={onNext} disabled={linkedAccounts.size === 0} style={{
          width: '100%', padding: '15px', borderRadius: 12,
          background: linkedAccounts.size > 0 ? T.color.brand : T.color.s2,
          color: linkedAccounts.size > 0 ? T.color.s0 : T.color.ghost,
          border: 'none', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700,
          cursor: linkedAccounts.size > 0 ? 'pointer' : 'not-allowed',
          transition: `all 0.18s ${T.ease.std}`,
          WebkitTapHighlightColor: 'transparent', letterSpacing: '-0.2px',
        }}>
          Continue
        </button>
        <button onClick={onNext} style={{
          width: '100%', padding: '12px', background: 'none', border: 'none',
          color: T.color.ghost, fontFamily: 'Inter, sans-serif', fontSize: 14, cursor: 'pointer',
        }}>
          Skip for now
        </button>
      </div>
    </div>
  )
}

function Step3({ onDone }) {
  const [phase, setPhase] = useState('scanning')
  useState(() => { const t = setTimeout(() => setPhase('done'), 2800); return () => clearTimeout(t) })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: `linear-gradient(140deg, #1a1a2e 0%, #2d1b4e 100%)`,
        padding: '32px 24px', flexShrink: 0,
      }}>
        <div style={{ ...T.font.label, color: T.color.ghost, marginBottom: 10 }}>STEP 2 OF 2</div>
        <div style={{ ...T.font.screenTitle, color: T.color.text, marginBottom: 4 }}>
          {phase === 'scanning' ? 'Finding your bookings…' : 'All set!'}
        </div>
        <div style={{ ...T.font.cardMeta, color: T.color.sub }}>
          {phase === 'scanning' ? 'Checking Gmail for confirmation emails' : `Found ${DEMO_BOOKINGS.length} reservations`}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: T.space.cardGap }}>
        {phase === 'scanning' ? (
          <>
            <BookingCard booking={DEMO_BOOKINGS[0]} onClick={() => {}} />
            <BookingCard booking={DEMO_BOOKINGS[2]} onClick={() => {}} />
            <ShimmerCard /><ShimmerCard /><ShimmerCard />
            <div style={{ ...T.font.cardMeta, color: T.color.ghost, textAlign: 'center', marginTop: 4, animation: 'pulse 1.5s ease infinite' }}>
              Scanning events &amp; concerts…
            </div>
          </>
        ) : (
          DEMO_BOOKINGS.map(b => <BookingCard key={b.id} booking={b} onClick={() => {}} />)
        )}
      </div>
      {phase === 'done' && (
        <div style={{ padding: '16px 24px 32px', flexShrink: 0 }}>
          <button onClick={onDone} style={{
            width: '100%', padding: '15px', borderRadius: 12,
            background: T.color.brand, color: T.color.s0, border: 'none',
            fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', letterSpacing: '-0.2px',
            WebkitTapHighlightColor: 'transparent',
          }}>
            Open my timeline
          </button>
        </div>
      )}
    </div>
  )
}

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const complete = useStore(s => s.complete)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.color.s0 }}>
      {step === 1 && <Step1 onNext={() => setStep(2)} />}
      {step === 2 && <Step2 onNext={() => setStep(3)} />}
      {step === 3 && <Step3 onDone={complete} />}
    </div>
  )
}
