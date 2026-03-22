// Storage key for JWT
export const TOKEN_KEY = 'shinkleesh_admin_token'

// Get token from localStorage
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || null
}

// Save token to localStorage
export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

// Clear token from localStorage
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// Decode JWT payload (base64url) — no verification, display only
export function decodeJwtPayload(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    // base64url → base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=')
    const decoded = atob(padded)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

/**
 * Strip fields that are empty string, null, or undefined.
 * Convert string "true"/"false" to booleans.
 */
export function clean(obj) {
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value === '' || value === null || value === undefined) continue
    if (value === 'true') {
      result[key] = true
    } else if (value === 'false') {
      result[key] = false
    } else {
      result[key] = value
    }
  }
  return result
}

/**
 * Make an API request.
 * @param {object} opts
 * @param {string} opts.method
 * @param {string} opts.path - e.g. "/auth/login"
 * @param {object} [opts.body] - will be cleaned and JSON-stringified
 * @param {object} [opts.query] - query params object
 * @param {string} [opts.token] - Bearer token
 * @returns {Promise<{ status: number, data: any, ms: number }>}
 */
export async function apiRequest({ method, path, body, query, token }) {
  const start = performance.now()

  let url = path
  if (query) {
    const cleaned = clean(query)
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(cleaned)) {
      params.set(k, String(v))
    }
    const qs = params.toString()
    if (qs) url += '?' + qs
  }

  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const options = { method, headers }
  if (body && method !== 'GET' && method !== 'DELETE') {
    options.body = JSON.stringify(clean(body))
  }

  try {
    const res = await fetch(url, options)
    const ms = Math.round(performance.now() - start)
    let data
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      data = await res.json()
    } else {
      data = await res.text()
    }
    return { status: res.status, data, ms }
  } catch (err) {
    const ms = Math.round(performance.now() - start)
    return { status: 0, data: { error: err.message }, ms }
  }
}
