const GMAIL = 'https://gmail.googleapis.com/gmail/v1/users/me'

const SEARCH_QUERY = [
  'subject:(confirmation OR reservation OR booking OR itinerary OR "your order" OR "order confirmed" OR "reservation confirmed")',
  'newer_than:2y',
  '-category:promotions',
  '-category:social',
].join(' ')

export async function listConfirmationEmails(accessToken, maxResults = 50) {
  const res = await fetch(
    `${GMAIL}/messages?q=${encodeURIComponent(SEARCH_QUERY)}&maxResults=${maxResults}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) throw new Error(`Gmail search failed: ${res.status}`)
  const data = await res.json()
  return data.messages || []
}

export async function getEmailText(accessToken, messageId) {
  const res = await fetch(
    `${GMAIL}/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) return null
  const msg = await res.json()
  return extractText(msg.payload)
}

function extractText(payload, depth = 0) {
  if (!payload || depth > 6) return null

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
    .slice(0, 4000)
}
