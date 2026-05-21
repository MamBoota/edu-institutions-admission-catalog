import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiFetch } from '../api'

export default function InstitutionDetailPage() {
  const { id } = useParams()
  const [inst, setInst] = useState(null)
  const [reviews, setReviews] = useState([])
  const [favIds, setFavIds] = useState(() => new Set())
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  const isFav = useMemo(() => favIds.has(Number(id)), [favIds, id])

  async function reload() {
    const [i, revs, favs] = await Promise.all([
      apiFetch(`/api/institutions/${id}`),
      apiFetch(`/api/institutions/${id}/reviews`),
      apiFetch('/api/favorites'),
    ])
    setInst(i)
    setReviews(revs)
    setFavIds(new Set(favs.map((f) => f.institution.id)))
  }

  useEffect(() => {
    reload().catch((e) => setError(String(e.message || e)))
  }, [id])

  async function toggleFav() {
    setError('')
    setMsg('')
    try {
      if (isFav) {
        await apiFetch(`/api/favorites/${id}`, { method: 'DELETE' })
        setMsg('Удалено из избранного')
      } else {
        await apiFetch(`/api/favorites/${id}`, { method: 'POST' })
        setMsg('Добавлено в избранное')
      }
      await reload()
    } catch (e) {
      setError(String(e.message || e))
    }
  }

  async function sendReview(e) {
    e.preventDefault()
    setError('')
    setMsg('')
    try {
      await apiFetch(`/api/institutions/${id}/reviews`, {
        method: 'POST',
        json: { rating: Number(rating), comment: comment.trim() || null },
      })
      setComment('')
      setMsg('Отзыв отправлен')
      await reload()
    } catch (e) {
      setError(String(e.message || e))
    }
  }

  if (!inst) {
    return error ? <p className="error">{error}</p> : <p className="muted">Загрузка…</p>
  }

  return (
    <section>
      <h1>{inst.name}</h1>
      <p className="muted">
        {inst.city_name} · средняя оценка:{' '}
        {inst.avg_rating != null ? inst.avg_rating.toFixed(2) : '—'} · отзывов: {inst.review_count}
      </p>
      {inst.description ? <p>{inst.description}</p> : null}

      <div className="row">
        <button type="button" onClick={toggleFav}>
          {isFav ? 'Убрать из избранного' : 'В избранное'}
        </button>
      </div>

      {msg ? <p className="ok">{msg}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <h2>Оставить отзыв</h2>
      <form className="form inline" onSubmit={sendReview}>
        <label>
          Оценка
          <select value={rating} onChange={(e) => setRating(e.target.value)}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="grow">
          Комментарий
          <input value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} />
        </label>
        <button type="submit">Отправить</button>
      </form>

      <h2>Отзывы</h2>
      <ul className="list">
        {reviews.length === 0 ? <li className="muted">Пока нет отзывов</li> : null}
        {reviews.map((r) => (
          <li key={r.id}>
            <strong>{r.rating}</strong> / 5 —{' '}
            <span className="muted">{new Date(r.created_at).toLocaleString()}</span>
            {r.comment ? <div>{r.comment}</div> : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
