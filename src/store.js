import { create } from 'zustand'

export const DEMO_BOOKINGS = [
  {
    id: 'b1',
    type: 'flight',
    title: 'JFK → LAX',
    subtitle: 'Delta 421 · Terminal 4 · Seat 14C',
    date: 'Jun 12',
    dateISO: '2025-06-12',
    time: '8:15 AM',
    status: 'confirmed',
    conf: 'DL421-JFK-LAX',
    details: {
      airline: 'Delta Air Lines',
      flightNum: 'DL 421',
      from: { code: 'JFK', name: 'John F. Kennedy International', terminal: 'Terminal 4', gate: 'B32' },
      to:   { code: 'LAX', name: 'Los Angeles International',     terminal: 'Terminal 5', gate: null  },
      departs: '8:15 AM',
      arrives: '11:42 AM',
      seat: '14C',
      class: 'Main Cabin',
      baggage: '1 carry-on included',
    },
  },
  {
    id: 'b2',
    type: 'hotel',
    title: 'Ace Hotel DTLA',
    subtitle: 'Jun 12 – Jun 16 · 4 nights',
    date: 'Jun 12',
    dateISO: '2025-06-12',
    time: '3:00 PM',
    status: 'confirmed',
    conf: 'ACE-8821-DTLA',
    details: {
      property: 'Ace Hotel Downtown Los Angeles',
      address: '929 S Broadway, Los Angeles, CA 90015',
      checkIn:  'Jun 12 · 3:00 PM',
      checkOut: 'Jun 16 · 12:00 PM',
      nights: 4,
      roomType: 'Deluxe Queen',
      guests: 2,
    },
  },
  {
    id: 'b3',
    type: 'dining',
    title: 'Bestia',
    subtitle: '7:30 PM · 2 guests',
    date: 'Jun 13',
    dateISO: '2025-06-13',
    time: '7:30 PM',
    status: 'today',
    conf: 'RSY-29311',
    details: {
      restaurant: 'Bestia',
      address: '2121 E 7th Pl, Los Angeles, CA 90021',
      reservedVia: 'Resy',
      partySize: 2,
      notes: 'Outdoor patio requested',
    },
  },
  {
    id: 'b4',
    type: 'concert',
    title: 'Bicep — Live',
    subtitle: 'Kia Forum · Sec 107 Row C',
    date: 'Jun 14',
    dateISO: '2025-06-14',
    time: '8:00 PM',
    status: 'soon',
    conf: 'TM-4829103',
    details: {
      artist: 'Bicep',
      venue: 'Kia Forum',
      address: '3900 W Manchester Blvd, Inglewood, CA 90305',
      section: '107',
      row: 'C',
      seats: '14, 15',
      ticketType: 'Floor GA',
      ticketVia: 'Ticketmaster',
      barcodeType: 'mobile',
    },
  },
  {
    id: 'b5',
    type: 'sports',
    title: 'Lakers vs Warriors',
    subtitle: 'Crypto.com Arena · Sec 108 Row 5',
    date: 'Jun 15',
    dateISO: '2025-06-15',
    time: '7:30 PM',
    status: 'confirmed',
    conf: 'AXS-1928374',
    details: {
      event: 'Los Angeles Lakers vs Golden State Warriors',
      venue: 'Crypto.com Arena',
      address: '1111 S Figueroa St, Los Angeles, CA 90015',
      section: '108',
      row: '5',
      seat: '12',
      ticketVia: 'AXS',
      barcodeType: 'safetix',
    },
  },
  {
    id: 'b6',
    type: 'theater',
    title: 'Hamilton',
    subtitle: 'Pantages · Orch Row G Seats 101–102',
    date: 'Jun 16',
    dateISO: '2025-06-16',
    time: '2:00 PM',
    status: 'confirmed',
    conf: 'TTX-8812-HLT',
    details: {
      show: 'Hamilton',
      venue: 'Hollywood Pantages Theatre',
      address: '6233 Hollywood Blvd, Los Angeles, CA 90028',
      section: 'Orchestra',
      row: 'G',
      seats: '101, 102',
      ticketVia: 'TodayTix',
      barcodeType: 'pdf',
    },
  },
  {
    id: 'b7',
    type: 'car',
    title: 'Hertz — Compact SUV',
    subtitle: 'LAX Pickup → Jun 25 Return',
    date: 'Jun 20',
    dateISO: '2025-06-20',
    time: '10:00 AM',
    status: 'pending',
    conf: 'HZ-334821-LAX',
    details: {
      company: 'Hertz',
      vehicle: 'Compact SUV (Toyota RAV4 or similar)',
      pickupLocation: 'LAX Car Rental Center',
      pickupDate: 'Jun 20 · 10:00 AM',
      returnDate: 'Jun 25 · 10:00 AM',
      duration: '5 days',
      ratePerDay: '$62/day',
    },
  },
]

export const useStore = create((set, get) => ({
  bookings: DEMO_BOOKINGS,
  activeTab: 'timeline',
  selectedId: null,
  searchQuery: '',
  activeFilter: 'all',
  isOnboarded: false,
  user: null,
  linkedAccounts: new Set(['gmail']),
  notifs: {
    flights: true, hotels: true, dining: true,
    concerts: true, sports: false, theater: true, cars: false,
  },

  setUser:     user     => set({ user }),
  setTab:      tab      => set({ activeTab: tab }),
  select:      id       => set({ selectedId: id }),
  deselect:    ()       => set({ selectedId: null }),
  setSearch:   q        => set({ searchQuery: q }),
  setFilter:   f        => set({ activeFilter: f }),
  complete:    ()       => set({ isOnboarded: true }),
  setBookings: bookings => set({ bookings }),

  addBooking: booking => set(s => {
    // Avoid duplicates by conf number if present
    if (booking.conf && s.bookings.some(b => b.conf === booking.conf)) return s
    const updated = [...s.bookings, booking].sort((a, b) =>
      (a.dateISO || '').localeCompare(b.dateISO || '')
    )
    return { bookings: updated }
  }),

  removeBooking: id => set(s => ({ bookings: s.bookings.filter(b => b.id !== id) })),

  toggleLinked: id => set(s => {
    const n = new Set(s.linkedAccounts)
    n.has(id) ? n.delete(id) : n.add(id)
    return { linkedAccounts: n }
  }),

  toggleNotif: key => set(s => ({
    notifs: { ...s.notifs, [key]: !s.notifs[key] },
  })),

  get selected() {
    return get().bookings.find(b => b.id === get().selectedId) ?? null
  },

  get filtered() {
    const { bookings, activeFilter, searchQuery } = get()
    let list = bookings
    if (activeFilter !== 'all') list = list.filter(b => b.type === activeFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.subtitle.toLowerCase().includes(q) ||
        b.conf?.toLowerCase().includes(q)
      )
    }
    return list
  },
}))
