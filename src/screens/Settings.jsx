import { useState } from 'react'
import { useStore } from '../store.js'
import { T } from '../tokens.js'
import { supabase } from '../lib/supabase.js'
import {
  Envelope, Bell, Info, SignOut, Check, CaretRight, EnvelopeOpen,
} from '@phosphor-icons/react'

function SLabel({ children }) {
  return <div style={{ ...T.font.label, color: T.color.ghost, margin: '20px 0 8px' }}>{children}</div>
}

function Row({ icon: Icon, label, description, right, onClick, danger }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: hov && onClick ? T.color.s2 : 'transparent',
        cursor: onClick ? 'pointer' : 'default',
        transition: `background 0.15s ${T.ease.std}`,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {Icon && (
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: danger ? 'rgba(248,113,113,0.12)' : T.color.s2,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={15} color={danger ? T.color.danger : T.color.sub} weight="regular" />
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ ...T.font.cardSub, color: danger ? T.color.danger : T.color.text, fontWeight: 500 }}>{label}</div>
        {description && <div style={{ ...T.font.cardMeta, color: T.color.ghost, marginTop: 1 }}>{description}</div>}
      </div>
      {right}
    </div>
  )
}

function Toggle({ enabled, onToggle }) {
  return (
    <div onClick={e => { e.stopPropagation(); onToggle() }} style={{
      width: 44, height: 26, borderRadius: 13,
      background: enabled ? T.color.brand : T.color.s3,
      position: 'relative', cursor: 'pointer',
      transition: `background 0.18s ${T.ease.std}`, flexShrink: 0,
      border: `1px solid ${enabled ? T.color.brand : T.color.sep}`,
    }}>
      <div style={{
        position: 'absolute', top: 2,
        left: enabled ? 19 : 2,
        width: 20, height: 20, borderRadius: '50%',
        background: enabled ? T.color.s0 : T.color.ghost,
        transition: `left 0.18s ${T.ease.std}`,
      }} />
    </div>
  )
}

function ToggleTile({ service, emoji, linked, onToggle }) {
  return (
    <div onClick={onToggle} style={{
      border: `1px solid ${linked ? 'rgba(74,222,128,0.3)' : T.color.sep}`,
      background: linked ? 'rgba(74,222,128,0.07)' : T.color.s1,
      borderRadius: 12, padding: '14px 10px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      cursor: 'pointer', transition: `all 0.18s ${T.ease.std}`,
    }}>
      <span style={{ fontSize: 22 }}>{emoji}</span>
      <div style={{ ...T.font.cardMeta, color: T.color.text, textAlign: 'center', fontWeight: 500 }}>{service}</div>
      <div style={{ ...T.font.label, color: linked ? '#4ADE80' : T.color.ghost, display: 'flex', alignItems: 'center', gap: 3, fontSize: 9 }}>
        {linked ? <><Check size={10} color="#4ADE80" weight="bold" /> Linked</> : 'Tap to link'}
      </div>
    </div>
  )
}

const NOTIFS = [
  { key: 'flights',  label: 'Flight alerts',     desc: 'Gate changes, delays, cancellations' },
  { key: 'hotels',   label: 'Hotel reminders',   desc: 'Check-in day alert' },
  { key: 'dining',   label: 'Dining reminders',  desc: '2 hours before reservation' },
  { key: 'concerts', label: 'Concert reminders', desc: 'Day before + 2 hours before' },
  { key: 'sports',   label: 'Sports reminders',  desc: 'Day before + 2 hours before' },
  { key: 'theater',  label: 'Theater reminders', desc: 'Day before performance' },
  { key: 'cars',     label: 'Car rental alerts', desc: 'Pickup day + return deadline' },
]

export default function Settings({ onScanInbox, hasGmailAccess }) {
  const { linkedAccounts, notifs, toggleLinked, toggleNotif, user } = useStore()

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.color.s0 }}>
      <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
        <div style={{ ...T.font.screenTitle, color: T.color.text }}>Settings</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}>
        <SLabel>Account</SLabel>
        <div style={{ background: T.color.s1, borderRadius: 14, border: `1px solid ${T.color.sep}`, overflow: 'hidden' }}>
          <Row icon={Envelope} label={user?.email ?? 'Signed in'} description="Primary account" />
        </div>

        <SLabel>Email connections</SLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { id: 'gmail',   service: 'Gmail',      emoji: '📧' },
            { id: 'outlook', service: 'Outlook',    emoji: '📨' },
            { id: 'apple',   service: 'Apple Mail', emoji: '✉️' },
          ].map(s => (
            <ToggleTile key={s.id} service={s.service} emoji={s.emoji}
              linked={linkedAccounts.includes(s.id)} onToggle={() => toggleLinked(s.id)} />
          ))}
        </div>
        <div style={{ ...T.font.cardMeta, color: T.color.ghost, marginTop: 8, lineHeight: 1.6 }}>
          We only read confirmation emails — never anything else.
        </div>

        <SLabel>Notifications</SLabel>
        <div style={{ background: T.color.s1, borderRadius: 14, border: `1px solid ${T.color.sep}`, overflow: 'hidden' }}>
          {NOTIFS.map((item, i, arr) => (
            <div key={item.key}>
              <Row
                label={item.label} description={item.desc}
                right={<Toggle enabled={notifs[item.key]} onToggle={() => toggleNotif(item.key)} />}
                onClick={() => toggleNotif(item.key)}
              />
              {i < arr.length - 1 && <div style={{ height: 1, background: T.color.sep, margin: '0 16px' }} />}
            </div>
          ))}
        </div>

        <SLabel>Import</SLabel>
        <div style={{ background: T.color.s1, borderRadius: 14, border: `1px solid ${T.color.sep}`, overflow: 'hidden' }}>
          {hasGmailAccess ? (
            <Row
              icon={EnvelopeOpen}
              label="Scan Gmail inbox"
              description="Find all confirmation emails automatically"
              onClick={onScanInbox}
              right={<CaretRight size={14} color={T.color.ghost} />}
            />
          ) : (
            <div style={{ padding: '14px 16px' }}>
              <div style={{ ...T.font.cardSub, color: T.color.text, fontWeight: 500, marginBottom: 4 }}>Scan Gmail inbox</div>
              <div style={{ ...T.font.cardMeta, color: T.color.ghost, lineHeight: 1.5, marginBottom: 10 }}>
                Sign out and sign back in to grant Gmail access.
              </div>
              <button onClick={signOut} style={{
                padding: '8px 14px', borderRadius: 8,
                background: T.color.brandDim, border: `1px solid ${T.color.brandBorder}`,
                color: T.color.brand, fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
              }}>
                Re-connect Google
              </button>
            </div>
          )}
        </div>

        <SLabel>App</SLabel>
        <div style={{ background: T.color.s1, borderRadius: 14, border: `1px solid ${T.color.sep}`, overflow: 'hidden' }}>
          <Row icon={Bell} label="Notification settings" onClick={() => {}} right={<CaretRight size={14} color={T.color.ghost} />} />
          <div style={{ height: 1, background: T.color.sep, margin: '0 16px' }} />
          <Row icon={Info} label="About Rezo" description="Version 1.0.0" onClick={() => {}} right={<CaretRight size={14} color={T.color.ghost} />} />
        </div>

        <SLabel>Account</SLabel>
        <div style={{ background: T.color.s1, borderRadius: 14, border: `1px solid ${T.color.sep}`, overflow: 'hidden' }}>
          <Row icon={SignOut} label="Sign out" danger onClick={signOut} />
        </div>
      </div>
    </div>
  )
}
