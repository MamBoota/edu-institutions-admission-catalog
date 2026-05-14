const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export function getToken() {
  return localStorage.getItem('token')
}

export function setToken(token) {
  if (token) localStorage.setItem('token', token)
  else localStorage.removeItem('token')
}

const API_UNAVAILABLE_MSG =
  'Сервер API недоступен (часто это 502). Из корня репозитория запустите всё одной командой: `make start` ' +
  '(или отдельно: бэкенд на http://127.0.0.1:8000, затем фронт на :5173).'

export async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) }
  let body = options.body
  if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.json)
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      body,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      throw new Error(API_UNAVAILABLE_MSG)
    }
    throw e
  }

  if (res.status === 204) return null

  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!res.ok) {
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error(API_UNAVAILABLE_MSG)
    }
    const detail =
      data && typeof data === 'object' && data.detail !== undefined
        ? JSON.stringify(data.detail)
        : text || res.statusText
    throw new Error(detail || `HTTP ${res.status}`)
  }
  return data
}
