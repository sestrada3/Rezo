import { T } from '../tokens.js'

export default function CategoryChip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      ...T.font.label,
      padding: '6px 14px', borderRadius: 20,
      border: `1px solid ${active ? T.color.brand : T.color.sep}`,
      background: active ? T.color.brandDim : 'transparent',
      color: active ? T.color.brand : T.color.sub,
      cursor: 'pointer', whiteSpace: 'nowrap',
      transition: `all 0.18s ${T.ease.std}`, outline: 'none',
      WebkitTapHighlightColor: 'transparent',
    }}>
      {label}
    </button>
  )
}
