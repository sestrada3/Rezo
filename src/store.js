import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set, get) => ({
  bookings: [],
  activeTab: 'timeline',
  selectedId: null,
  searchQuery: '',
  activeFilter: 'all',
  isOnboarded: false,
  user: null,
  linkedAccounts: ['gmail'],
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

  toggleLinked: id => set(s => ({
    linkedAccounts: s.linkedAccounts.includes(id)
      ? s.linkedAccounts.filter(x => x !== id)
      : [...s.linkedAccounts, id],
  })),

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
}),
{
  name: 'rezo-storage',
  partialize: state => ({ isOnboarded: state.isOnboarded }),
}
)
)
