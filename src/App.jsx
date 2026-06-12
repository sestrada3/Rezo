import { useState, useEffect } from 'react'
import { useStore } from './store.js'
import { T } from './tokens.js'
import { supabase } from './lib/supabase.js'
import { loadBookings } from './lib/bookings.js'
import BottomNav from './components/BottomNav.jsx'
import Timeline from './screens/Timeline.jsx'
import Wallet from './screens/Wallet.jsx'
import Search from './screens/Search.jsx'
import Settings from './screens/Settings.jsx'
import BookingDetail from './screens/BookingDetail.jsx'
import Onboarding from './screens/Onboarding.jsx'
import ImportEmail from './screens/ImportEmail.jsx'
import ScanInbox from './screens/ScanInbox.jsx'
import Auth from './screens/Auth.jsx'
import { Plus } from '@phosphor-icons/react'

const GlobalStyle = () => (
  <style>{`
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    body {
      font-family: 'Inter', sans-serif;
      background: #0C0C0F;
      display: flex; align-items: center; justify-content: center;
      min-height: 100dvh;
    }
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
    @keyframes spin    { to { transform: rotate(360deg); } }
  `}</style>
)

function DesktopBrand() {
  return (
    <div id="desktop-brand" style={{ display: 'none', flexDirection: 'column', gap: 32, maxWidth: 380 }}>
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <span style={{ fontSize: 48, fontWeight: 800, color: T.color.brand, fontFamily: 'Inter, sans-serif', lineHeight: 1, letterSpacing: '-2px' }}>re</span>
        <span style={{ fontSize: 48, fontWeight: 800, color: T.color.sub,   fontFamily: 'Inter, sans-serif', lineHeight: 1, letterSpacing: '-2px' }}>zo</span>
      </div>
      <div>
        <div style={{ fontSize: 32, fontWeight: 700, color: T.color.text, fontFamily: 'Inter, sans-serif', lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.5px' }}>
          Every reservation.<br />One place.
        </div>
        <div style={{ fontSize: 15, color: T.color.sub, fontFamily: 'Inter, sans-serif', lineHeight: 1.7 }}>
          Rezo finds your flights, hotels, restaurants, shows, concerts, and more — automatically from your email.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { emoji: '✈️', text: 'Flights, hotels, dining, concerts, sports, theater, cars' },
          { emoji: '📧', text: 'Auto-scans Gmail — no forwarding or copy-paste needed' },
          { emoji: '📱', text: 'Install on your phone — works like a native app' },
        ].map(({ emoji, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{emoji}</span>
            <span style={{ fontSize: 14, color: T.color.sub, lineHeight: 1.5 }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AppShell({ children, showNav, onImport }) {
  const { activeTab, setTab } = useStore()
  return (
    <div style={{
      width: '100%', maxWidth: 430,
      height: '100dvh', maxHeight: 932,
      background: T.color.s0,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      position: 'relative',
    }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
      {showNav && <BottomNav active={activeTab} onTab={setTab} />}
      {onImport && (
        <button onClick={onImport} style={{
          position: 'absolute', bottom: T.space.navHeight + 16, right: 20,
          width: 52, height: 52, borderRadius: '50%',
          background: T.color.brand, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 20px rgba(245,166,35,0.4)`,
          zIndex: 10, WebkitTapHighlightColor: 'transparent',
          transition: `transform 0.15s ${T.ease.std}`,
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Plus size={22} color={T.color.s0} weight="bold" />
        </button>
      )}
    </div>
  )
}

export default function App() {
  const { isOnboarded, activeTab, selectedId, user, setUser, setBookings } = useStore()
  const [showImport, setShowImport]   = useState(false)
  const [showScan, setShowScan]       = useState(false)
  const [gmailToken, setGmailToken]   = useState(null)
  const [authReady, setAuthReady]     = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setGmailToken(session?.provider_token ?? null)
      setAuthReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setGmailToken(session?.provider_token ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

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
        <AppShell>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ ...T.font.cardMeta, color: T.color.ghost, animation: 'pulse 1.2s ease infinite' }}>Loading…</div>
          </div>
        </AppShell>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <GlobalStyle />
        <DesktopBrand />
        <AppShell><Auth /></AppShell>
      </>
    )
  }

  if (selectedId) {
    return (
      <>
        <GlobalStyle />
        <AppShell><BookingDetail /></AppShell>
      </>
    )
  }

  const screens = {
    timeline: <Timeline />,
    wallet:   <Wallet />,
    search:   <Search />,
    settings: <Settings onScanInbox={() => setShowScan(true)} hasGmailAccess={!!gmailToken} />,
  }

  return (
    <>
      <GlobalStyle />
      <DesktopBrand />
      <AppShell showNav onImport={() => setShowImport(true)}>
        {screens[activeTab]}
      </AppShell>
      {showImport && <ImportEmail onClose={() => setShowImport(false)} userId={user.id} />}
      {showScan && (
        <ScanInbox
          onClose={() => setShowScan(false)}
          accessToken={gmailToken}
          userId={user.id}
        />
      )}
    </>
  )
}
