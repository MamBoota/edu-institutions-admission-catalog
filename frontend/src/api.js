const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export function getToken() {
  return localStorage.getItem('token')
}

export function setToken(token) {
  if (token) localStorage.setItem('token', token)
  else localStorage.removeItem('token')
}

const API_UNAVAILABLE_MSG =
  'Сервер API недоступен. Локально: `make start`. На myproj76.ru: запустите Uvicorn (scripts/start-api-shared.sh) и проверьте api.php в корне сайта.'

function isApiPath(path) {
  return path.startsWith('/api')
}

function looksLikeHtml(text) {
  const t = text.trimStart().toLowerCase()
  return t.startsWith('<!doctype') || t.startsWith('<html')
}

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
  const ctype = res.headers.get('content-type') || ''
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (isApiPath(path) && res.ok && (typeof data !== 'object' || data === null)) {
    if (looksLikeHtml(text) || !ctype.includes('json')) {
      throw new Error(
        'API вернул HTML вместо JSON. На shared REG.RU: положите deploy/api.php в корень сайта, ' +
          'соберите фронт с VITE_API_BASE=/api.php и запустите Uvicorn на :8000.',
      )
    }
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
