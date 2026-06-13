import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const TOPIC = `projects/${process.env.GOOGLE_CLOUD_PROJECT}/topics/rezo-gmail-push`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId, email, accessToken, refreshToken } = req.body ?? {}
  if (!userId || !accessToken) return res.status(400).json({ error: 'Missing params' })

  try {
    // Start Gmail watch
    const watchRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/watch',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicName: TOPIC,
          labelIds: ['INBOX'],
        }),
      }
    )

    if (!watchRes.ok) {
      const err = await watchRes.json()
      return res.status(400).json({ error: 'Watch failed', detail: err })
    }

    const { historyId, expiration } = await watchRes.json()

    // Save tokens + watch state to Supabase
    await supabase.from('user_tokens').upsert({
      user_id:       userId,
      email:         email,
      refresh_token: refreshToken,
      history_id:    historyId,
      watch_expiry:  new Date(Number(expiration)).toISOString(),
      updated_at:    new Date().toISOString(),
    }, { onConflict: 'user_id' })

    return res.status(200).json({ ok: true, historyId, expiration })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
