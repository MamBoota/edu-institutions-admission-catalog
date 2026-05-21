import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api'

export default function CatalogPage() {
  const [cities, setCities] = useState([])
  const [rows, setRows] = useState([])
  const [cityId, setCityId] = useState('')
  const [q, setQ] = useState('')
  const [applySaved, setApplySaved] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/api/public/cities').then(setCities).catch(() => setCities([]))
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (cityId) params.set('city_id', cityId)
    if (q.trim()) params.set('q', q.trim())
    params.set('apply_saved_filter', applySaved ? 'true' : 'false')
    const qs = params.toString()
    apiFetch(`/api/institutions?${qs}`)
      .then(setRows)
      .catch((e) => setError(String(e.message || e)))
  }, [cityId, q, applySaved])

  return (
    <section>
      <h1>Каталог учреждений</h1>
      <p className="muted">
        Если включено «учитывать сохранённые предпочтения», при пустом фильтре города подставится
        город из профиля поступления (если задан).
      </p>
      <div className="filters">
        <label>
          Город
          <select value={cityId} onChange={(e) => setCityId(e.target.value)}>
            <option value="">Все / по предпочтениям</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Поиск по названию
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Например, IT" />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={applySaved}
            onChange={(e) => setApplySaved(e.target.checked)}
          />
          Учитывать сохранённые предпочтения
        </label>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Город</th>
              <th>Ср. оценка</th>
              <th>Отзывов</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link to={`/catalog/${r.id}`}>{r.name}</Link>
                </td>
                <td>{r.city_name}</td>
                <td>{r.avg_rating != null ? r.avg_rating.toFixed(2) : '—'}</td>
                <td>{r.review_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
