import { useEffect, useState } from 'react'
import { apiFetch } from '../api'

export default function CitiesPage() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)

  async function load() {
    try {
      const data = await apiFetch('/api/cities')
      setRows(data)
      setUpdatedAt(new Date())
      setError('')
    } catch (e) {
      setError(String(e.message || e))
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 15000)
    return () => clearInterval(id)
  }, [])

  return (
    <section>
      <h1>Города</h1>
      <p className="muted">
        Средняя оценка и число отзывов по всем учреждениям города. Список обновляется автоматически
        каждые 15 секунд (демо «почти в реальном времени»).
      </p>
      {updatedAt ? (
        <p className="muted small">Последнее обновление: {updatedAt.toLocaleString()}</p>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Город</th>
              <th>Средняя оценка</th>
              <th>Отзывов</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
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
