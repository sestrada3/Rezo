import { T } from '../tokens.js'
import {
  CalendarBlank, Ticket, MagnifyingGlass, GearSix,
} from '@phosphor-icons/react'

const TABS = [
  { id: 'timeline', label: 'Timeline', Icon: CalendarBlank },
  { id: 'wallet',   label: 'Wallet',   Icon: Ticket        },
  { id: 'search',   label: 'Search',   Icon: MagnifyingGlass },
  { id: 'settings', label: 'Settings', Icon: GearSix       },
]

export default function BottomNav({ active, onTab }) {
  return (
    <div style={{
      padding: '0 16px 12px',
      background: 'transparent',
      flexShrink: 0,
    }}>
      <div style={{
        display: 'flex',
        background: T.color.s2,
        border: `1px solid ${T.color.sep}`,
        borderRadius: 20,
        padding: '6px',
        gap: 4,
      }}>
        {TABS.map(({ id, label, Icon }) => {
          const on = active === id
          return (
            <button
              key={id}
              onClick={() => onTab(id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                padding: '8px 4px',
                borderRadius: 14,
                background: on ? T.color.s3 : 'transparent',
                border: 'none', cursor: 'pointer', outline: 'none',
                transition: `background 0.18s ${T.ease.std}`,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Icon
                size={20}
                color={on ? T.color.brand : T.color.ghost}
                weight={on ? 'fill' : 'regular'}
              />
              <span style={{
                fontFamily: 'Inter, sans-serif', fontSize: 10,
                fontWeight: on ? 600 : 400,
                color: on ? T.color.brand : T.color.ghost,
                letterSpacing: '0.2px',
              }}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
