import { useState } from 'react'
import { useStore } from '../store.js'
import { T } from '../tokens.js'
import StatusBadge from '../components/StatusBadge.jsx'
import {
  ArrowLeft, Copy, Check, MapPin, ArrowSquareOut,
  Wallet, Info,
  Airplane, Buildings, ForkKnife, MusicNotes, SoccerBall, MaskHappy, Car, Tag,
} from '@phosphor-icons/react'

const CAT_ICONS = {
  flight: Airplane, hotel: Buildings, dining: ForkKnife,
  concert: MusicNotes, sports: SoccerBall, theater: MaskHappy,
  car: Car, other: Tag,
}

function Divider() {
  return <div style={{ height: 1, background: T.color.sep }} />
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, padding: '11px 20px' }}>
        <span style={{ ...T.font.cardMeta, color: T.color.ghost, flexShrink: 0 }}>{label}</span>
        <span style={{ ...T.font.cardSub, color: T.color.text, textAlign: 'right' }}>{value}</span>
      </div>
      <Divider />
    </>
  )
}

function ConfPill({ value }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1800) }
  return (
    <div onClick={copy} style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      background: T.color.s2, border: `1px solid ${T.color.sep}`,
      borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
    }}>
      <span style={{ ...T.font.mono, color: T.color.text }}>{value}</span>
      {copied
        ? <Check size={12} color="#4ADE80" weight="bold" />
        : <Copy size={12} color={T.color.ghost} />}
    </div>
  )
}

function FlightDetail({ d }) {
  return (
    <>
      <div style={{ textAlign: 'center', padding: '28px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 32, fontWeight: 500, color: T.color.text, letterSpacing: '-1px' }}>{d.from?.code}</div>
            <div style={{ ...T.font.cardMeta, color: T.color.ghost }}>{d.from?.name?.split(' ').slice(0,2).join(' ')}</div>
          </div>
          <Airplane size={18} color={T.color.ghost} weight="regular" style={{ transform: 'rotate(45deg)', flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 32, fontWeight: 500, color: T.color.text, letterSpacing: '-1px' }}>{d.to?.code}</div>
            <div style={{ ...T.font.cardMeta, color: T.color.ghost }}>{d.to?.name?.split(' ').slice(0,2).join(' ')}</div>
          </div>
        </div>
        <div style={{ ...T.font.cardMeta, color: T.color.ghost }}>{d.airline} · {d.flightNum}</div>
      </div>
      <Divider />
      <Row label="Departs"  value={d.departs} />
      <Row label="Arrives"  value={d.arrives} />
      <Row label="Terminal" value={d.from?.terminal} />
      <Row label="Gate"     value={d.from?.gate ?? 'See airport monitors'} />
      <Row label="Seat"     value={d.seat} />
      <Row label="Cabin"    value={d.class} />
      <Row label="Baggage"  value={d.baggage} />
    </>
  )
}

function HotelDetail({ d }) {
  return (
    <>
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ ...T.font.cardHead, color: T.color.text, marginBottom: 4 }}>{d.property}</div>
        {d.address && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 16 }}>
            <MapPin size={12} color={T.color.ghost} />
            <span style={{ ...T.font.cardMeta, color: T.color.ghost }}>{d.address}</span>
          </div>
        )}
      </div>
      <Divider />
      <Row label="Check-in"  value={d.checkIn} />
      <Row label="Check-out" value={d.checkOut} />
      <Row label="Duration"  value={d.nights ? `${d.nights} nights` : null} />
      <Row label="Room"      value={d.roomType} />
      <Row label="Guests"    value={d.guests} />
    </>
  )
}

function DiningDetail({ d }) {
  return (
    <>
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ ...T.font.cardHead, color: T.color.text, marginBottom: 4 }}>{d.restaurant}</div>
        {d.address && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 16 }}>
            <MapPin size={12} color={T.color.ghost} />
            <span style={{ ...T.font.cardMeta, color: T.color.ghost }}>{d.address}</span>
          </div>
        )}
      </div>
      <Divider />
      <Row label="Reserved via" value={d.reservedVia} />
      <Row label="Party size"   value={d.partySize} />
      <Row label="Notes"        value={d.notes} />
    </>
  )
}

function EventDetail({ d }) {
  const isSafeTix = d.barcodeType === 'safetix'
  return (
    <>
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ ...T.font.cardHead, color: T.color.text, marginBottom: 4 }}>
          {d.artist || d.event || d.show}
        </div>
        {d.address && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 16 }}>
            <MapPin size={12} color={T.color.ghost} />
            <span style={{ ...T.font.cardMeta, color: T.color.ghost }}>{d.address}</span>
          </div>
        )}
      </div>
      <Divider />
      <Row label="Venue"      value={d.venue} />
      <Row label="Section"    value={d.section} />
      <Row label="Row"        value={d.row} />
      <Row label="Seats"      value={d.seats} />
      <Row label="Ticket via" value={d.ticketVia} />
      {isSafeTix && (
        <div style={{ margin: '12px 20px', padding: '12px 14px', borderRadius: 10, background: T.color.brandDim, border: `1px solid ${T.color.brandBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <Info size={15} color={T.color.brand} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ ...T.font.cardSub, color: T.color.brand, fontWeight: 600, marginBottom: 2 }}>Dynamic ticket</div>
              <div style={{ ...T.font.cardMeta, color: T.color.sub, lineHeight: 1.5 }}>
                This ticket uses SafeTix / AXS. Open the issuing app on your phone to access your barcode.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function CarDetail({ d }) {
  return (
    <>
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ ...T.font.cardHead, color: T.color.text, marginBottom: 4 }}>{d.company}</div>
        <div style={{ ...T.font.cardMeta, color: T.color.ghost, marginBottom: 16 }}>{d.vehicle}</div>
      </div>
      <Divider />
      <Row label="Pickup"   value={d.pickupLocation ? `${d.pickupLocation} · ${d.pickupDate}` : d.pickupDate} />
      <Row label="Return"   value={d.returnDate} />
      <Row label="Duration" value={d.duration} />
      <Row label="Rate"     value={d.ratePerDay} />
    </>
  )
}

function DetailBody({ booking }) {
  const d = booking.details
  switch (booking.type) {
    case 'flight':  return <FlightDetail d={d} />
    case 'hotel':   return <HotelDetail  d={d} />
    case 'dining':  return <DiningDetail d={d} />
    case 'concert':
    case 'sports':
    case 'theater': return <EventDetail  d={d} />
    case 'car':     return <CarDetail    d={d} />
    default:        return null
  }
}

export default function BookingDetail() {
  const deselect   = useStore(s => s.deselect)
  const selectedId = useStore(s => s.selectedId)
  const selected   = useStore(s => s.bookings.find(b => b.id === s.selectedId) ?? null)
  const cat = T.cat[selected?.type] || T.cat.other
  const CatIcon = CAT_ICONS[selected?.type] || Tag

  if (!selected) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.color.s0 }}>
      {/* Hero header */}
      <div style={{
        background: `linear-gradient(140deg, ${cat.g1} 0%, ${cat.g2} 100%)`,
        padding: '20px 20px 28px', position: 'relative', overflow: 'hidden', flexShrink: 0,
      }}>
        <div style={{ position: 'absolute', right: -32, top: -32, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <button onClick={deselect} style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24,
          background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: 8,
          padding: '7px 12px', color: 'rgba(255,255,255,0.85)', cursor: 'pointer', outline: 'none',
          fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500,
          WebkitTapHighlightColor: 'transparent', backdropFilter: 'blur(8px)',
        }}>
          <ArrowLeft size={14} color="rgba(255,255,255,0.85)" /> Back
        </button>

        {/* Category chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <CatIcon size={13} color="rgba(255,255,255,0.6)" weight="regular" />
          <span style={{ ...T.font.label, color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{cat.label}</span>
        </div>

        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.3px', marginBottom: 4 }}>
          {selected.title}
        </div>
        <div style={{ ...T.font.cardSub, color: 'rgba(255,255,255,0.75)', marginBottom: 16 }}>
          {selected.subtitle}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '6px 12px',
            backdropFilter: 'blur(8px)',
          }}>
            <span style={{ ...T.font.mono, color: 'rgba(255,255,255,0.9)' }}>{selected.date}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>·</span>
            <span style={{ ...T.font.mono, color: 'rgba(255,255,255,0.9)' }}>{selected.time}</span>
          </div>
          <StatusBadge status={selected.status} />
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', background: T.color.s0 }}>
        <DetailBody booking={selected} />

        {/* Conf number */}
        {selected.conf && (
          <div style={{ padding: '0 20px' }}>
            <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ ...T.font.cardMeta, color: T.color.ghost }}>Confirmation #</span>
              <ConfPill value={selected.conf} />
            </div>
            <Divider />
          </div>
        )}

        {/* CTA */}
        <div style={{ padding: '20px 20px 32px' }}>
          <button style={{
            width: '100%', padding: '14px', borderRadius: 12,
            background: T.color.brand, color: T.color.s0, border: 'none',
            fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            letterSpacing: '-0.2px',
            WebkitTapHighlightColor: 'transparent',
          }}>
            <Wallet size={16} color={T.color.s0} weight="fill" />
            Add to Wallet
          </button>
        </div>
      </div>
    </div>
  )
}
