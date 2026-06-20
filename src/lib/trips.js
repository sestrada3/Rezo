// Groups bookings into trips for the timeline, mirroring TripIt-style
// itinerary bundling. Two strategies, in priority order:
//
// 1. Round-trip flight windows — if a flight A→B is followed by a later
//    flight B→A, everything dated between those two flights (inclusive)
//    is one trip: the outbound/return legs plus any hotel, car, dining,
//    or event bookings in between. This is the reliable signal (airport
//    codes are exact), unlike trying to string-match a hotel's city
//    against a flight's airport code.
// 2. Fallback date-adjacency clustering for leftover bookings that aren't
//    bracketed by a round-trip flight pair (e.g. a weekend hotel stay with
//    no flight on file, or a one-way flight) — bookings within 1 day of
//    each other still bundle into a trip.
//
// Anything left over as a single, isolated booking is NOT wrapped in a
// trip — a trip implies multiple bookings, same as TripIt.

function destinationLabel(items, homeCode, anchorCode) {
  const hotel = items.find(b => b.type === 'hotel' && b.details?.property)
  if (hotel) return hotel.details.property

  if (anchorCode && anchorCode !== homeCode) return anchorCode

  const venue = items.find(b => b.details?.venue)
  if (venue) return venue.details.venue

  const car = items.find(b => b.type === 'car' && b.details?.pickupLocation)
  if (car) return car.details.pickupLocation

  return null
}

function dateRangeLabel(startISO, endISO) {
  const fmt = iso => {
    const d = new Date(iso + 'T00:00:00')
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${months[d.getMonth()]} ${d.getDate()}`
  }
  return startISO === endISO ? fmt(startISO) : `${fmt(startISO)} – ${fmt(endISO)}`
}

function byDate(items) {
  const map = new Map()
  for (const b of items) {
    if (!map.has(b.dateISO)) map.set(b.dateISO, [])
    map.get(b.dateISO).push(b)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateISO, items]) => ({ dateISO, date: items[0].date, items }))
}

export function groupIntoTrips(bookings) {
  const sorted = [...bookings.filter(b => b.dateISO)].sort((a, b) => a.dateISO.localeCompare(b.dateISO))

  // Home base = most common airport code across all flights, used only to
  // pick the more interesting code (destination, not origin) as a label.
  const codeCounts = {}
  for (const b of sorted) {
    if (b.type !== 'flight') continue
    const f = b.details?.from?.code, t = b.details?.to?.code
    if (f) codeCounts[f] = (codeCounts[f] || 0) + 1
    if (t) codeCounts[t] = (codeCounts[t] || 0) + 1
  }
  const homeCode = Object.entries(codeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const flights = sorted.filter(b => b.type === 'flight' && b.details?.from?.code && b.details?.to?.code)
  const usedIds = new Set()
  const windows = []

  for (const out of flights) {
    if (usedIds.has(out.id)) continue
    const ret = flights
      .filter(b =>
        !usedIds.has(b.id) && b.id !== out.id && b.dateISO >= out.dateISO &&
        b.details.from.code === out.details.to.code && b.details.to.code === out.details.from.code
      )
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO))[0]
    if (!ret) continue
    usedIds.add(out.id)
    usedIds.add(ret.id)
    windows.push({ startISO: out.dateISO, endISO: ret.dateISO, anchorCode: out.details.to.code })
  }
  windows.sort((a, b) => a.startISO.localeCompare(b.startISO))

  const assigned = new Set()
  const trips = windows.map(w => {
    const items = sorted.filter(b => !assigned.has(b.id) && b.dateISO >= w.startISO && b.dateISO <= w.endISO)
    items.forEach(b => assigned.add(b.id))
    return {
      kind: 'trip',
      key: `trip_${w.startISO}_${w.anchorCode}`,
      label: destinationLabel(items, homeCode, w.anchorCode),
      dateRange: dateRangeLabel(w.startISO, w.endISO),
      startISO: w.startISO,
      days: byDate(items),
    }
  })

  // Fallback: cluster whatever's left by date adjacency (gap <= 1 day).
  const remaining = sorted.filter(b => !assigned.has(b.id))
  const clusters = []
  let current = []
  for (const b of remaining) {
    const last = current[current.length - 1]
    if (last) {
      const gapDays = (new Date(b.dateISO) - new Date(last.dateISO)) / 86400000
      if (gapDays > 1) { clusters.push(current); current = [] }
    }
    current.push(b)
  }
  if (current.length) clusters.push(current)

  for (const items of clusters) {
    if (items.length < 2) {
      trips.push({ kind: 'day', key: `day_${items[0].dateISO}_${items[0].id}`, startISO: items[0].dateISO, days: byDate(items) })
      continue
    }
    const startISO = items[0].dateISO, endISO = items[items.length - 1].dateISO
    trips.push({
      kind: 'trip',
      key: `trip_${startISO}_fallback`,
      label: destinationLabel(items, homeCode, null),
      dateRange: dateRangeLabel(startISO, endISO),
      startISO,
      days: byDate(items),
    })
  }

  return trips.sort((a, b) => a.startISO.localeCompare(b.startISO))
}
