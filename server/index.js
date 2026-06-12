import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { parseEmail } from './parse.js'

const app = express()
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json({ limit: '50kb' }))

app.post('/api/parse-email', async (req, res) => {
  const { emailText } = req.body
  if (!emailText?.trim()) {
    return res.status(400).json({ error: 'emailText is required' })
  }
  try {
    const result = await parseEmail(emailText)
    return res.json(result)
  } catch (err) {
    console.error('parse error:', err)
    return res.status(500).json({ error: 'internal_error', message: err.message })
  }
})

app.get('/api/health', (_req, res) => res.json({ ok: true }))

const PORT = 3001
app.listen(PORT, () => console.log(`Rezo API running on http://localhost:${PORT}`))
