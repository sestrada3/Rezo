import { useStore } from '../store.js'
import { T } from '../tokens.js'
import BookingCard from '../components/BookingCard.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { Wallet as WalletIcon } from '@phosphor-icons/react'

export default function Wallet() {
  const { bookings, select } = useStore()

  const todayItems     = bookings.filter(b => b.status === 'today')
  const soonItems      = bookings.filter(b => b.status === 'soon')
  const confirmedItems = bookings.filter(b => b.status === 'confirmed')
  const pendingItems   = bookings.filter(b => b.status === 'pending')

  const Section = ({ label, items }) => {
    if (!items.length) return null
    return (
      <div>
        <SectionHeader label={label} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: T.space.cardGap }}>
          {items.map(b => <BookingCard key={b.id} booking={b} isToday={b.status === 'today'} onClick={() => select(b.id)} />)}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.color.s0 }}>
      <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
        <div style={{ ...T.font.screenTitle, color: T.color.text }}>Wallet</div>
        <div style={{ ...T.font.cardMeta, color: T.color.ghost, marginTop: 2 }}>All your passes, ready to show</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Section label="TONIGHT"   items={todayItems}     />
        <Section label="SOON"      items={soonItems}      />
        <Section label="CONFIRMED" items={confirmedItems} />
        <Section label="PENDING"   items={pendingItems}   />

        {/* Wallet promo */}
        <div style={{
          borderRadius: 14, background: T.color.s1,
          border: `1px solid ${T.color.sep}`, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: T.color.brandDim, border: `1px solid ${T.color.brandBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <WalletIcon size={18} color={T.color.brand} weight="regular" />
          </div>
          <div>
            <div style={{ ...T.font.cardSub, color: T.color.text, fontWeight: 600, marginBottom: 2 }}>Apple & Google Wallet</div>
            <div style={{ ...T.font.cardMeta, color: T.color.sub, lineHeight: 1.5 }}>Tap any booking → Add to Wallet</div>
          </div>
        </div>

        <div style={{ height: 8 }} />
      </div>
    </div>
  )
}
