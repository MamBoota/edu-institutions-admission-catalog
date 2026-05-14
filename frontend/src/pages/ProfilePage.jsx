import { useEffect, useState } from 'react'
import { apiFetch } from '../api'
import { useAuth } from '../auth/AuthContext'

export default function ProfilePage() {
  const { me, refresh } = useAuth()
  const [cities, setCities] = useState([])
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState(17)
  const [cityId, setCityId] = useState('')
  const [prefCity, setPrefCity] = useState('')
  const [direction, setDirection] = useState('')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    apiFetch('/api/public/cities').then(setCities).catch(() => setCities([]))
  }, [])

  useEffect(() => {
    if (!me?.profile) return
    setFullName(me.profile.full_name)
    setAge(me.profile.age)
    setCityId(me.profile.city_id ? String(me.profile.city_id) : '')
  }, [me])

  useEffect(() => {
    apiFetch('/api/me/preferences')
      .then((p) => {
        setPrefCity(p.preferred_city_id ? String(p.preferred_city_id) : '')
        setDirection(p.study_direction || '')
      })
      .catch(() => {})
  }, [me])

  async function saveProfile(e) {
    e.preventDefault()
    setError('')
    setMsg('')
    try {
      await apiFetch('/api/me/profile', {
        method: 'PATCH',
        json: {
          full_name: fullName.trim(),
          age: Number(age),
          city_id: cityId ? Number(cityId) : null,
        },
      })
      setMsg('Профиль сохранён')
      await refresh()
    } catch (err) {
      setError(String(err.message || err))
    }
  }

  async function savePrefs(e) {
    e.preventDefault()
    setError('')
    setMsg('')
    try {
      await apiFetch('/api/me/preferences', {
        method: 'PUT',
        json: {
          preferred_city_id: prefCity ? Number(prefCity) : null,
          study_direction: direction.trim() || null,
        },
      })
      setMsg('Предпочтения сохранены')
      await refresh()
    } catch (err) {
      setError(String(err.message || err))
    }
  }

  return (
    <section>
      <h1>Профиль</h1>
      <p className="muted">Роль: {me?.user?.role}</p>

      {msg ? <p className="ok">{msg}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <h2>Личные данные</h2>
      <form className="form" onSubmit={saveProfile}>
        <label>
          ФИО
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label>
          Возраст
          <input
            type="number"
            min={10}
            max={100}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
          />
        </label>
        <label>
          Город
          <select value={cityId} onChange={(e) => setCityId(e.target.value)}>
            <option value="">Не выбран</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Сохранить профиль</button>
      </form>

      <h2>Предпочтения поступления</h2>
      <form className="form" onSubmit={savePrefs}>
        <label>
          Предпочитаемый город
          <select value={prefCity} onChange={(e) => setPrefCity(e.target.value)}>
            <option value="">Не задан</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Направление / специальность
          <input value={direction} onChange={(e) => setDirection(e.target.value)} maxLength={200} />
        </label>
        <button type="submit">Сохранить предпочтения</button>
      </form>
    </section>
  )
}
