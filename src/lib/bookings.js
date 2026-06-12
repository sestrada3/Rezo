import { supabase } from './supabase.js'

export async function parseAndSaveEmail(emailText, userId = null) {
  const res = await fetch('/api/parse-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailText }),
  })
  const result = await res.json()
  if (!result.ok) throw new Error(result.error || 'parse_failed')

  const b = result.booking

  const row = {
    type:      b.type,
    title:     b.title,
    subtitle:  b.subtitle,
    date:      b.date,
    date_iso:  b.dateISO,
    time:      b.time,
    status:    b.status ?? 'confirmed',
    conf:      b.conf ?? null,
    details:   b.details ?? {},
    raw_email: emailText,
    source:    'manual',
    user_id:   userId,
  }

  const { data, error } = await supabase.from('bookings').insert(row).select().single()
  if (error) throw new Error(error.message)

  return dbRowToBooking(data)
}

export async function loadBookings(userId = null) {
  let query = supabase.from('bookings').select('*').order('date_iso', { ascending: true })

  if (userId) query = query.eq('user_id', userId)
  else        query = query.is('user_id', null)

  const { data, error } = await query
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
