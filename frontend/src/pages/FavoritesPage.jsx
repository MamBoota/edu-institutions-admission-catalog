import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api'

export default function FavoritesPage() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/api/favorites')
      .then(setRows)
      .catch((e) => setError(String(e.message || e)))
  }, [])

  return (
    <section>
      <h1>Избранное</h1>
      {error ? <p className="error">{error}</p> : null}
      <ul className="list">
        {rows.length === 0 ? <li className="muted">Пока пусто — добавляйте учреждения со страницы каталога.</li> : null}
        {rows.map((r) => (
          <li key={r.institution.id}>
            <Link to={`/catalog/${r.institution.id}`}>{r.institution.name}</Link>
            <span className="muted"> — {r.institution.city_name}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
