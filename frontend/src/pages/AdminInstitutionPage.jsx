import { useEffect, useState } from 'react'
import { apiFetch } from '../api'

export default function AdminInstitutionPage() {
  const [cities, setCities] = useState([])
  const [name, setName] = useState('')
  const [cityId, setCityId] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    apiFetch('/api/public/cities').then(setCities).catch(() => setCities([]))
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setMsg('')
    if (!cityId) {
      setError('Выберите город')
      return
    }
    try {
      await apiFetch('/api/institutions', {
        method: 'POST',
        json: {
          name: name.trim(),
          city_id: Number(cityId),
          description: description.trim() || null,
        },
      })
      setMsg('Учреждение создано')
      setName('')
      setDescription('')
    } catch (err) {
      setError(String(err.message || err))
    }
  }

  return (
    <section>
      <h1>Админ: новое учреждение</h1>
      <p className="muted">Доступно только роли admin.</p>
      {msg ? <p className="ok">{msg}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      <form className="form" onSubmit={onSubmit}>
        <label>
          Название
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Город
          <select value={cityId} onChange={(e) => setCityId(e.target.value)} required>
            <option value="">Выберите</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Описание
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </label>
        <button type="submit">Создать</button>
      </form>
    </section>
  )
}
