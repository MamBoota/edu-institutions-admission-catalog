import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'
import { useAuth } from '../auth/AuthContext'
import PasswordField from '../components/PasswordField'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [cities, setCities] = useState([])
  const [citiesError, setCitiesError] = useState('')
  const [citiesLoading, setCitiesLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState(17)
  const [cityId, setCityId] = useState('')
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    setCitiesLoading(true)
    setCitiesError('')
    apiFetch('/api/public/cities')
      .then((list) => {
        setCities(Array.isArray(list) ? list : [])
        if (!Array.isArray(list) || list.length === 0) {
          setCitiesError('Список городов пуст — выполните make db-bootstrap на сервере.')
        }
      })
      .catch((err) => {
        setCities([])
        setCitiesError(String(err.message || err))
      })
      .finally(() => setCitiesLoading(false))
  }, [])

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const passwordOk = password.length >= 8
  const nameOk = fullName.trim().length >= 2
  const ageOk = age >= 10 && age <= 100
  const canSubmit = emailOk && passwordOk && nameOk && ageOk

  async function onSubmit(e) {
    e.preventDefault()
    setTouched(true)
    setError('')
    if (!canSubmit) return
    try {
      await register({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        age: Number(age),
        city_id: cityId ? Number(cityId) : null,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(String(err.message || err))
    }
  }

  return (
    <section className="auth-card">
      <h1>Регистрация</h1>
      <p className="muted">
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
      <form onSubmit={onSubmit} className="form" noValidate>
        <label>
          ФИО
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        {touched && !nameOk ? <p className="error">Минимум 2 символа</p> : null}

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
        {touched && !ageOk ? <p className="error">Возраст от 10 до 100</p> : null}

        <label>
          Город (профиль)
          <select
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            disabled={citiesLoading || cities.length === 0}
          >
            <option value="">
              {citiesLoading ? 'Загрузка…' : cities.length ? 'Не выбран' : 'Нет городов'}
            </option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {citiesError ? <p className="error">{citiesError}</p> : null}

        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        {touched && !emailOk ? <p className="error">Введите корректный email</p> : null}

        <PasswordField
          label="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          error={touched && !passwordOk}
        />
        {touched && !passwordOk ? (
          <p className="error">Минимум 8 символов</p>
        ) : null}

        {error ? <p className="error">{error}</p> : null}

        <button type="submit" disabled={!canSubmit}>
          Зарегистрироваться
        </button>
      </form>
    </section>
  )
}
