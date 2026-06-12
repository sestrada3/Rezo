import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You are a booking confirmation email parser. Extract reservation data from emails and return a single JSON object.

Return ONLY valid JSON, no prose, no markdown fences. If the email is not a booking confirmation, return {"error": "not_a_booking"}.

JSON schema to return:
{
  "type": "flight|hotel|dining|concert|sports|theater|car|other",
  "title": "short display title (e.g. JFK → LAX, Bestia, Hamilton)",
  "subtitle": "2-3 key details on one line (e.g. Delta 421 · Terminal 4 · Seat 14C)",
  "date": "Mon DD format (e.g. Jun 12)",
  "dateISO": "YYYY-MM-DD",
  "time": "H:MM AM/PM",
  "status": "confirmed|pending|cancelled",
  "conf": "confirmation number or code",
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
      max_tokens: 1024,
      system: SYSTEM,
      messages: [{ role: 'user', content: `Parse this confirmation email:\n\n${emailText}` }],
    })

    const text = message.content[0].text.trim()

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) return res.status(500).json({ ok: false, error: 'parse_failed' })
      parsed = JSON.parse(match[0])
    }

    if (parsed.error) return res.status(422).json({ ok: false, error: parsed.error })
    return res.status(200).json({ ok: true, booking: { ...parsed, id: `b_${Date.now()}` } })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}
