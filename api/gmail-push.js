import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You are a booking confirmation email parser. Extract reservation data from emails and return a single JSON object.
Return ONLY valid JSON, no prose, no markdown fences. If the email is not a booking confirmation, return {"error": "not_a_booking"}.
JSON schema:
{
  "type": "flight|hotel|dining|concert|sports|theater|car|other",
  "title": "short display title",
  "subtitle": "2-3 key details separated by ·",
  "date": "Mon DD",
  "dateISO": "YYYY-MM-DD",
  "time": "H:MM AM/PM",
  "status": "confirmed|pending|cancelled",
  "conf": "confirmation number",
  "details": {}
}`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    // Decode Pub/Sub message
    const body = req.body
    if (!body?.message?.data) return res.status(200).end() // ack empty

    const decoded = JSON.parse(Buffer.from(body.message.data, 'base64').toString())
    const { emailAddress, historyId: newHistoryId } = decoded

    if (!emailAddress || !newHistoryId) return res.status(200).end()

    // Look up user by email
    const { data: tokenRow } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('email', emailAddress)
      .single()

    if (!tokenRow?.refresh_token) return res.status(200).end()

    // Refresh access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: tokenRow.refresh_token,
        grant_type:    'refresh_token',
      }),
    })
    const { access_token } = await tokenRes.json()
    if (!access_token) return res.status(200).end()

    // Get new messages from history
    const histRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${tokenRow.history_id}&historyTypes=messageAdded`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    )
    const histData = await histRes.json()
    const added = histData.history?.flatMap(h => h.messagesAdded ?? []) ?? []

    // Process each new message
    for (const { message: { id } } of added) {
      try {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
          { headers: { Authorization: `Bearer ${access_token}` } }
        )
        const msg = await msgRes.json()
        const text = extractText(msg.payload)
        if (!text) continue

        // Parse with Claude
        const aiRes = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: SYSTEM,
          messages: [{ role: 'user', content: `Parse this confirmation email:\n\n${text.slice(0, 4000)}` }],
        })

        let parsed
        try { parsed = JSON.parse(aiRes.content[0].text.trim()) } catch { continue }
        if (parsed.error) continue

        const booking = {
          user_id:    tokenRow.user_id,
          type:       parsed.type,
          title:      parsed.title,
          subtitle:   parsed.subtitle,
          date:       parsed.date,
          date_iso:   parsed.dateISO,
          time:       parsed.time,
          status:     parsed.status,
          conf:       parsed.conf ?? null,
          details:    parsed.details ?? {},
        }

        // Insert (skip duplicates by conf)
        if (booking.conf) {
          const { data: existing } = await supabase
            .from('bookings')
            .select('id')
            .eq('user_id', tokenRow.user_id)
            .eq('conf', booking.conf)
            .single()
          if (existing) continue
        }

        await supabase.from('bookings').insert(booking)

        // Send push notification if subscribed
        if (tokenRow.push_sub) {
          await sendPush(tokenRow.push_sub, {
            title: `New reservation: ${parsed.title}`,
            body:  `${parsed.date} · ${parsed.time}`,
          })
        }
      } catch { continue }
    }

    // Update stored historyId
    await supabase.from('user_tokens')
      .update({ history_id: String(newHistoryId), updated_at: new Date().toISOString() })
      .eq('email', emailAddress)

    return res.status(200).end() // must ack within 10s
  } catch (err) {
    console.error('gmail-push error:', err)
    return res.status(200).end() // always ack to avoid Pub/Sub retries
  }
}

async function sendPush(subscription, payload) {
  const webpush = await import('web-push')
  webpush.default.setVapidDetails(
    'mailto:hello@rezo.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
  await webpush.default.sendNotification(subscription, JSON.stringify(payload))
}

function extractText(payload, depth = 0) {
  if (!payload || depth > 6) return null
  if (payload.mimeType === 'text/plain' && payload.body?.data)
    return Buffer.from(payload.body.data, 'base64url').toString('utf-8')
  if (payload.parts) {
    for (const p of payload.parts) {
      if (p.mimeType === 'text/plain') { const t = extractText(p, depth + 1); if (t) return t }
    }
    for (const p of payload.parts) {
      if (p.mimeType === 'text/html') {
        const h = extractText(p, depth + 1)
        if (h) return h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      }
    }
  }
  if (payload.body?.data) return Buffer.from(payload.body.data, 'base64url').toString('utf-8')
  return null
}
