import { supabase } from './supabase.js'

function bookingToRow(b, userId, source) {
  return {
    type:      b.type,
    title:     b.title,
    subtitle:  b.subtitle,
    date:      b.date,
    date_iso:  b.dateISO,
    time:      b.time,
    status:    b.status ?? 'confirmed',
    conf:      b.conf ?? null,
    details:   b.details ?? {},
    raw_email: b.raw_email ?? null,
    source:    source,
    user_id:   userId,
  }
}

// Parse an email into one or more bookings WITHOUT writing to the DB.
// One email can hold multiple distinct reservations (e.g. outbound + return
// flight legs of a round-trip itinerary), so this always returns an array.
export async function parseEmail(emailText) {
  const res = await fetch('/api/parse-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailText }),
  })
  const result = await res.json()
  if (!result.ok) throw new Error(result.error || 'parse_failed')
  return result.bookings.map(b => ({ ...b, raw_email: emailText }))
}

// Parse + persist a single email (used by manual import). May yield more
// than one booking (e.g. round-trip flight legs sharing one confirmation).
export async function parseAndSaveEmail(emailText, userId) {
  if (!userId) throw new Error('not_signed_in')
  const bookings = await parseEmail(emailText)
  return saveBookings(bookings, userId, 'manual')
}

// Bulk upsert confirmed bookings. Dedupes on (user_id, conf, date_iso) —
// NOT just (user_id, conf), since multiple distinct reservations (e.g. the
// outbound and return legs of one round-trip itinerary) often share a single
// confirmation/itinerary number but always have different dates.
export async function saveBookings(bookings, userId, source = 'scan') {
  if (!userId) throw new Error('not_signed_in')
  if (!bookings.length) return []

  const withConf    = bookings.filter(b => b.conf)
  const withoutConf = bookings.filter(b => !b.conf)
  const saved = []

  // Rows with a conf number can be safely upserted (idempotent).
  if (withConf.length) {
    const { data, error } = await supabase
      .from('bookings')
      .upsert(withConf.map(b => bookingToRow(b, userId, source)), {
        onConflict: 'user_id,conf,date_iso',
      })
      .select()
    if (error) throw new Error(error.message)
    saved.push(...data.map(dbRowToBooking))
  }

  // Rows without a conf can't be deduped by the index — plain insert.
  if (withoutConf.length) {
    const { data, error } = await supabase
      .from('bookings')
      .insert(withoutConf.map(b => bookingToRow(b, userId, source)))
      .select()
    if (error) throw new Error(error.message)
    saved.push(...data.map(dbRowToBooking))
  }

  return saved
}

export async function loadBookings(userId) {
  if (!userId) return []

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .order('date_iso', { ascending: true })
  if (error) throw new Error(error.message)
  return data.map(dbRowToBooking)
}

export async function deleteBooking(id) {
  const { error } = await supabase.from('bookings').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

function dbRowToBooking(row) {
  return {
    id:       row.id,
    type:     row.type,
    title:    row.title,
    subtitle: row.subtitle ?? '',
    date:     row.date ?? '',
    dateISO:  row.date_iso ?? '',
    time:     row.time ?? '',
    status:   row.status ?? 'confirmed',
    conf:     row.conf ?? null,
    details:  row.details ?? {},
    source:   row.source ?? 'manual',
  }
}
