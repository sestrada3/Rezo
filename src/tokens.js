export const T = {
  color: {
    // Surfaces — 5-8% luminance steps
    s0:      '#0C0C0F',   // app background
    s1:      '#151519',   // cards, rows
    s2:      '#1D1D23',   // sheets, drawers
    s3:      '#252530',   // modals
    sep:     'rgba(255,255,255,0.07)',
    // Text
    text:    '#F0F0F5',
    sub:     '#8888A0',
    ghost:   '#555568',
    // Brand
    brand:   '#F5A623',   // warm amber
    brandDim:'rgba(245,166,35,0.12)',
    brandBorder: 'rgba(245,166,35,0.3)',
    // Utility
    white:   '#FFFFFF',
    danger:  '#F87171',
  },

  // Status — dark-mode tuned
  status: {
    confirmed: { bg: 'rgba(74,222,128,0.12)',  fg: '#4ADE80', label: 'Confirmed' },
    today:     { bg: 'rgba(251,191,36,0.14)',  fg: '#FBB724', label: 'Tonight'   },
    soon:      { bg: 'rgba(251,146,60,0.12)',  fg: '#FB923C', label: 'Soon'      },
    cancelled: { bg: 'rgba(248,113,113,0.12)', fg: '#F87171', label: 'Cancelled' },
    pending:   { bg: 'rgba(148,163,184,0.1)',  fg: '#64748B', label: 'Pending'   },
  },

  // Category — 7 types, dark-mode saturations
  cat: {
    flight:  { bg: 'rgba(74,158,255,0.14)',  fg: '#4A9EFF', label: 'FLIGHT',  g1: '#1E3A8A', g2: '#4A9EFF' },
    hotel:   { bg: 'rgba(245,166,35,0.14)',  fg: '#F5A623', label: 'HOTEL',   g1: '#78350F', g2: '#F5A623' },
    dining:  { bg: 'rgba(76,175,114,0.14)',  fg: '#4CAF72', label: 'DINING',  g1: '#064E3B', g2: '#4CAF72' },
    concert: { bg: 'rgba(192,132,252,0.14)', fg: '#C084FC', label: 'CONCERT', g1: '#4C1D95', g2: '#C084FC' },
    sports:  { bg: 'rgba(255,112,67,0.14)',  fg: '#FF7043', label: 'SPORTS',  g1: '#7C2D12', g2: '#FF7043' },
    theater: { bg: 'rgba(232,121,160,0.14)', fg: '#E879A0', label: 'THEATER', g1: '#831843', g2: '#E879A0' },
    car:     { bg: 'rgba(38,198,198,0.14)',  fg: '#26C6C6', label: 'CAR',     g1: '#134E4A', g2: '#26C6C6' },
    other:   { bg: 'rgba(148,163,184,0.1)',  fg: '#94A3B8', label: 'OTHER',   g1: '#1E293B', g2: '#475569' },
  },

  font: {
    display:   { fontFamily: 'Inter, sans-serif', fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.2 },
    screenTitle:{ fontFamily: 'Inter, sans-serif', fontSize: 20, fontWeight: 600, letterSpacing: '-0.3px' },
    cardHead:  { fontFamily: 'Inter, sans-serif', fontSize: 17, fontWeight: 600, letterSpacing: '-0.2px' },
    cardSub:   { fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400 },
    cardMeta:  { fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 400 },
    mono:      { fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 400, fontVariantNumeric: 'tabular-nums' },
    monoSm:    { fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 400, fontVariantNumeric: 'tabular-nums' },
    label:     { fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' },
    badge:     { fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' },
    body:      { fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, lineHeight: 1.6 },
  },

  space: {
    pagePad: 20, cardPad: 16, cardRadius: 14,
    cardGap: 6, iconTile: 38, iconRadius: 10,
    navHeight: 80,
  },

  ease: {
    std:  'cubic-bezier(0.4,0,0.2,1)',
    out:  'cubic-bezier(0,0,0.2,1)',
    in:   'cubic-bezier(0.4,0,1,1)',
  },
}
