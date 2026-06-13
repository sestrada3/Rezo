import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { userId, subscription } = req.body ?? {}
  if (!userId || !subscription) return res.status(400).json({ error: 'Missing params' })

  await supabase.from('user_tokens')
    .update({ push_sub: subscription, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  return res.status(200).json({ ok: true })
}
