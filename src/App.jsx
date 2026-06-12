import { useState, useEffect } from 'react'
import { useStore } from './store.js'
import { T } from './tokens.js'
import { supabase } from './lib/supabase.js'
import { loadBookings } from './lib/bookings.js'
import BottomNav from './components/BottomNav.jsx'
import Icon from './components/Icon.jsx'
import Timeline from './screens/Timeline.jsx'
import Wallet from './screens/Wallet.jsx'
import Search from './screens/Search.jsx'
import Settings from './screens/Settings.jsx'
import BookingDetail from './screens/BookingDetail.jsx'
import Onboarding from './screens/Onboarding.jsx'
import ImportEmail from './screens/ImportEmail.jsx'
import Auth from './screens/Auth.jsx'

const GlobalStyle = () => (
  <style>{`
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    body {
      font-family: 'DM Sans', sans-serif;
      background: #EEF2FF;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh;
    }
    /* Desktop: show branding beside the phone */
    @media (min-width: 900px) {
      body { gap: 64px; padding: 40px; }
      #desktop-brand { display: flex !important; }
    }
    input, button, textarea { font-family: inherit; }
    ::-webkit-scrollbar { display: none; }
    * { scrollbar-width: none; }
    @keyframes fadeIn  { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes shimmer { from { transform: translateX(-100%); } to { transform: translateX(200%); } }
    @keyframes pulse   { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `}</style>
)

function DesktopBrand() {
  return (
    <div id="desktop-brand" style={{
      display: 'none',
      flexDirection: 'column', gap: 32,
      maxWidth: 380,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <span style={{ fontSize: 48, fontWeight: 700, color: '#4338CA', fontFamily: 'DM Sans, sans-serif', lineHeight: 1 }}>re</span>
        <span style={{ fontSize: 48, fontWeight: 700, color: '#818CF8', fontFamily: 'DM Sans, sans-serif', lineHeight: 1 }}>zo</span>
      </div>

      <div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#0F0F1A', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.25, marginBottom: 16 }}>
          Every reservation.<br />One place.
        </div>
        <div style={{ fontSize: 16, color: '#6B7280', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.7 }}>
          Rezo finds your flights, hotels, restaurants, shows, concerts, and more — automatically from your email. One timeline. No switching apps.
        </div>
      </div>

      {/* Feature list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { emoji: '✈️', text: 'Flights, hotels, dining, concerts, sports, theater, cars' },
          { emoji: '📧', text: 'Auto-imports from Gmail — no copy-paste needed' },
          { emoji: '📱', text: 'Install on your phone — works like a native app' },
          { emoji: '🎫', text: 'Add passes to Apple or Google Wallet' },
        ].map(({ emoji, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{emoji}</span>
            <span style={{ fontSize: 15, color: '#374151', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5 }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AppShell({ children, showNav, showImport, onImport }) {
  const { activeTab, setTab } = useStore()
  return (
    <div style={{
      width: '100%', maxWidth: 430,
      height: '100dvh', maxHeight: 932,
      background: T.color.surface,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
      position: 'relative',
    }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
      {showNav && <BottomNav active={activeTab} onTab={setTab} />}

      {showImport && (
        <button
          onClick={onImport}
          style={{
            position: 'absolute',
            bottom: T.space.navHeight + 16,
            right: 20,
            width: 52, height: 52, borderRadius: '50%',
            background: T.color.brand,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(67,56,202,0.4)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            WebkitTapHighlightColor: 'transparent',
            zIndex: 10,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(67,56,202,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(67,56,202,0.4)' }}
        >
          <Icon name="plus" color="#fff" size={22} />
        </button>
      )}
    </div>
  )
}

export default function App() {
  const { isOnboarded, activeTab, selectedId, user, setUser, setBookings } = useStore()
  const [showImport, setShowImport] = useState(false)
  const [authReady, setAuthReady]   = useState(false)

  // Listen for Supabase auth changes (handles magic link redirect too)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load bookings whenever auth state settles
  useEffect(() => {
    if (!authReady || !isOnboarded) return
    loadBookings(user?.id ?? null)
      .then(rows => { if (rows.length > 0) setBookings(rows) })
      .catch(() => {})
  }, [authReady, isOnboarded, user?.id])

  if (!authReady) {
    return (
      <>
        <GlobalStyle />
        <AppShell showNav={false} showImport={false}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ ...T.font.cardMeta, color: T.color.muted, animation: 'pulse 1.2s ease infinite' }}>
              Loading…
            </div>
          </div>
        </AppShell>
      </>
    )
  }

  // Not logged in → show auth screen (with desktop branding)
  if (!user) {
    return (
      <>
        <GlobalStyle />
        <DesktopBrand />
        <AppShell showNav={false} showImport={false}>
          <Auth />
        </AppShell>
      </>
    )
  }

  // Logged in but not onboarded yet → onboarding flow
  if (!isOnboarded) {
    return (
      <>
        <GlobalStyle />
        <AppShell showNav={false} showImport={false}>
          <Onboarding />
        </AppShell>
      </>
    )
  }

  if (selectedId) {
    return (
      <>
        <GlobalStyle />
        <AppShell showNav={false} showImport={false}>
          <BookingDetail />
        </AppShell>
      </>
    )
  }

  const screens = {
    timeline: <Timeline />,
    wallet:   <Wallet />,
    search:   <Search />,
    settings: <Settings />,
  }

  return (
    <>
      <GlobalStyle />
      <DesktopBrand />
      <AppShell showNav showImport onImport={() => setShowImport(true)}>
        {screens[activeTab]}
      </AppShell>
      {showImport && <ImportEmail onClose={() => setShowImport(false)} userId={user.id} />}
    </>
  )
}
