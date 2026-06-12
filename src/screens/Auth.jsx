import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { T } from '../tokens.js'
import {
  Airplane, Buildings, ForkKnife, MusicNotes, SoccerBall, MaskHappy, Car, Ticket,
} from '@phosphor-icons/react'

const CATS = [
  { Icon: Airplane,   label: 'FLIGHT'  },
  { Icon: Buildings,  label: 'HOTEL'   },
  { Icon: ForkKnife,  label: 'DINING'  },
  { Icon: MusicNotes, label: 'CONCERT' },
  { Icon: SoccerBall, label: 'SPORTS'  },
  { Icon: MaskHappy,  label: 'THEATER' },
  { Icon: Car,        label: 'CAR'     },
  { Icon: Ticket,     label: 'EVENTS'  },
]

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const signIn = async () => {
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        scopes: 'https://www.googleapis.com/auth/gmail.readonly',
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (err) { setError(err.message); setLoading(false) }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '48px 28px 40px', background: T.color.s0 }}>
      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
        <span style={{ fontSize: 36, fontWeight: 800, color: T.color.brand, fontFamily: 'Inter, sans-serif', letterSpacing: '-1.5px' }}>re</span>
        <span style={{ fontSize: 36, fontWeight: 800, color: T.color.sub,   fontFamily: 'Inter, sans-serif', letterSpacing: '-1.5px' }}>zo</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 32 }}>
        {/* Category icon grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {CATS.map(({ Icon, label }) => {
            const cat = T.cat[label.toLowerCase()] || T.cat.other
            return (
              <div key={label} style={{
                aspectRatio: '1', borderRadius: 14, background: cat.bg,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}>
                <Icon size={22} color={cat.fg} weight="regular" />
                <span style={{ ...T.font.label, color: cat.fg, fontSize: 8 }}>{label}</span>
              </div>
            )
          })}
        </div>

        <div>
          <div style={{ ...T.font.display, color: T.color.text, marginBottom: 12 }}>
            Every reservation.<br />One place.
          </div>
          <div style={{ ...T.font.body, color: T.color.sub, lineHeight: 1.7, fontSize: 14 }}>
            Rezo finds your flights, hotels, restaurants, shows, and more — automatically from your email.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {error && <div style={{ ...T.font.cardMeta, color: T.color.danger, textAlign: 'center' }}>{error}</div>}
        <button onClick={signIn} disabled={loading} style={{
          width: '100%', padding: '14px 20px', borderRadius: 12,
          background: loading ? T.color.s2 : T.color.s1,
          border: `1px solid ${T.color.sep}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: `all 0.18s ${T.ease.std}`,
          WebkitTapHighlightColor: 'transparent',
        }}>
          {!loading ? (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          ) : (
            <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${T.color.sep}`, borderTopColor: T.color.brand, animation: 'spin 0.8s linear infinite' }} />
          )}
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: T.color.text }}>
            {loading ? 'Redirecting…' : 'Continue with Google'}
          </span>
        </button>
        <div style={{ ...T.font.cardMeta, color: T.color.ghost, textAlign: 'center', lineHeight: 1.6 }}>
          We only read confirmation emails, never anything else.
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
