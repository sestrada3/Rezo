import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You are a booking confirmation email parser. Extract reservation data from emails and return ONLY valid JSON, no prose, no markdown fences.

Many confirmation emails cover MORE THAN ONE reservation — most commonly a
round-trip or multi-city flight itinerary (separate outbound/return/connecting
flight segments), but also things like a hotel stay split across two non-
contiguous bookings, or a multi-event ticket order. Each such segment is its
own distinct reservation with its own date, even if they share one
itinerary/order/confirmation number.

- If the email contains exactly ONE reservation, return a single JSON object
  matching the schema below.
- If the email contains MULTIPLE distinct reservations (e.g. outbound +
  return flight legs), return a JSON ARRAY of objects, one per reservation,
  each matching the schema below. Do not merge separate legs/segments into
  one object — every distinct date+route/event needs its own entry.
- If the email is not a booking confirmation, return {"error": "not_a_booking"}.

JSON schema (for each object):
{
  "type": "flight|hotel|dining|concert|sports|theater|car|other",
  "title": "short display title (e.g. JFK → LAX, Bestia, Hamilton)",
  "subtitle": "2-3 key details on one line (e.g. Delta 421 · Terminal 4 · Seat 14C)",
  "date": "Mon DD format (e.g. Jun 12)",
  "dateISO": "YYYY-MM-DD",
  "time": "H:MM AM/PM",
  "status": "confirmed|pending|cancelled",
  "conf": "confirmation number or code (same value across legs that share one itinerary number is fine)",
  "details": {
    // FLIGHT: airline, flightNum, from{code,name,terminal,gate}, to{code,name,terminal,gate}, departs, arrives, seat, class, baggage
    // HOTEL: property, address, checkIn, checkOut, nights, roomType, guests
    // DINING: restaurant, address, reservedVia, partySize, notes
    // CONCERT/THEATER: artist or show, venue, address, section, row, seats, ticketVia, barcodeType (pdf|mobile|safetix)
    // SPORTS: event, venue, address, section, row, seat, ticketVia, barcodeType (pdf|mobile|safetix)
    // CAR: company, vehicle, pickupLocation, pickupDate, returnDate, duration, ratePerDay
  }
}

Rules:
- title should be ultra-concise
- subtitle packs the 2-3 most important details, separated by · (middle dot)
- For SafeTix (AXS, Ticketmaster SafeTix) set barcodeType: "safetix"
- If a field is unknown, omit it rather than guessing`

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const { emailText } = req.body ?? {}
  if (!emailText?.trim()) return res.status(400).json({ ok: false, error: 'emailText required' })

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM,
      messages: [{ role: 'user', content: `Parse this confirmation email:\n\n${emailText}` }],
    })

    const text = message.content[0].text.trim()

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      // Fallback for stray prose around the JSON — try array first since an
      // array response is wrapped in [...], not {...}.
      const match = text.match(/\[[\s\S]*\]/) || text.match(/\{[\s\S]*\}/)
      if (!match) return res.status(500).json({ ok: false, error: 'parse_failed' })
      parsed = JSON.parse(match[0])
    }

    if (parsed.error) return res.status(422).json({ ok: false, error: parsed.error })

    // Claude is instructed to return a bare array for multi-leg emails, but
    // models sometimes wrap it anyway (e.g. {"bookings": [...]}). Unwrap any
    // single common wrapper key before treating it as a flat list.
    let list = Array.isArray(parsed) ? parsed : [parsed]
    if (list.length === 1 && !Array.isArray(parsed)) {
      const wrapperKey = ['bookings', 'reservations', 'items', 'results'].find(
        k => Array.isArray(parsed[k])
      )
      if (wrapperKey) list = parsed[wrapperKey]
    }

    // A real booking always has at least these fields. Drop anything that
    // doesn't, rather than letting a malformed item hit the DB's not-null
    // constraints and fail the whole save.
    const valid = list.filter(b => b && b.type && b.title && b.dateISO)
    if (!valid.length) {
      console.warn('[rezo parse] no valid bookings in response', text.slice(0, 500))
      return res.status(500).json({ ok: false, error: 'parse_failed' })
    }

    const bookings = valid.map((b, i) => ({ ...b, id: `b_${Date.now()}_${i}` }))
    return res.status(200).json({ ok: true, bookings })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}
