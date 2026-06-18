const GMAIL = 'https://gmail.googleapis.com/gmail/v1/users/me'

// Fetch with backoff on Gmail rate-limit (429) and transient 5xx responses.
async function fetchWithRetry(url, opts, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, opts)
    if (res.status !== 429 && res.status < 500) return res
    if (i === tries - 1) return res
    await new Promise(r => setTimeout(r, 2 ** i * 500))
  }
}

// Search the whole email, not just the subject — lots of real confirmations
// (e.g. "You're going to Hamilton!", "Your trip details") don't use any of
// these words in the subject line. Claude's parser does the final filtering
// for whether something is actually a booking, so a wider net here just
// costs a few extra parse calls rather than silently missing reservations.
const SEARCH_QUERY = [
  '(confirmation OR confirmed OR reservation OR reserved OR booking OR booked OR itinerary OR receipt OR eticket OR "e-ticket" OR boarding OR "your order" OR "your trip" OR "your reservation" OR "your booking")',
  'newer_than:2y',
  '-category:social',
].join(' ')

export async function listConfirmationEmails(accessToken, maxTotal = 500) {
  const messages = []
  let pageToken = null

  do {
    const url = new URL(`${GMAIL}/messages`)
    url.searchParams.set('q', SEARCH_QUERY)
    url.searchParams.set('maxResults', Math.min(500, maxTotal - messages.length))
    if (pageToken) url.searchParams.set('pageToken', pageToken)

    const res = await fetchWithRetry(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) throw new Error(`Gmail search failed: ${res.status}`)
    const data = await res.json()

    if (data.messages) messages.push(...data.messages)
    pageToken = data.nextPageToken ?? null
  } while (pageToken && messages.length < maxTotal)

  return messages
}

// Returns { text, subject } so callers can log the subject alongside any
// downstream parse failure, instead of only knowing the opaque message id.
export async function getEmailText(accessToken, messageId) {
  const res = await fetchWithRetry(
    `${GMAIL}/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) return { text: null, subject: null }
  const msg = await res.json()
  const subject = msg.payload?.headers?.find(h => h.name === 'Subject')?.value ?? null
  const text = extractText(msg.payload)
  if (!text?.trim()) {
    console.warn('[rezo scan] no extractable text', { messageId, subject })
  }
  return { text, subject }
}

function extractText(payload, depth = 0) {
  if (!payload || depth > 12) return null

  // Prefer plain text
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return base64Decode(payload.body.data)
  }

  // Recurse into parts
  if (payload.parts) {
    // First pass: plain text
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain') {
        const text = extractText(part, depth + 1)
        if (text?.trim()) return text
      }
    }
    // Second pass: HTML fallback
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html') {
        const html = extractText(part, depth + 1)
        if (html?.trim()) return stripHtml(html)
      }
    }
    // Third pass: recurse nested
    for (const part of payload.parts) {
      const text = extractText(part, depth + 1)
      if (text?.trim()) return text
    }
  }

  // Inline body data
  if (payload.body?.data) {
    const raw = base64Decode(payload.body.data)
    if (payload.mimeType === 'text/html') return stripHtml(raw)
    return raw
  }

  return null
}

function base64Decode(str) {
  try {
    // Gmail uses base64url (- and _ instead of + and /)
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
    return decodeURIComponent(
      atob(b64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    )
  } catch {
    return ''
  }
}

function stripHtml(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 16000)
}
