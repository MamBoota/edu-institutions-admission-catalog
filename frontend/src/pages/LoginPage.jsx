import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import PasswordField from '../components/PasswordField'

const DEMO_ACCOUNTS = [
  { label: 'Админ', email: 'admin@edu.example', password: 'Admin12345' },
  { label: 'Пользователь', email: 'user@edu.example', password: 'User12345' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const loc = useLocation()
  const from = loc.state?.from || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const passwordOk = password.length >= 8
  const canSubmit = emailOk && passwordOk

  async function onSubmit(e) {
    e.preventDefault()
    setTouched(true)
    setError('')
    if (!canSubmit) return
    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(String(err.message || err))
    }
  }

  function fillDemo(account) {
    setEmail(account.email)
    setPassword(account.password)
    setError('')
    setTouched(false)
  }

  async function loginDemo(account) {
    setEmail(account.email)
    setPassword(account.password)
    setError('')
    setTouched(true)
    try {
      await login(account.email, account.password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(String(err.message || err))
    }
  }

  return (
    <section className="auth-card">
      <h1>Вход</h1>
      <p className="muted">
        Доступ к каталогу только для зарегистрированных пользователей.{' '}
        <Link to="/register">Создать аккаунт</Link>
      </p>
      <form onSubmit={onSubmit} className="form" noValidate>
        <label>
          Email
          <input
            type="email"
            placeholder="Введите ваш email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        {touched && !emailOk ? <p className="error">Введите корректный email</p> : null}

        <PasswordField
          label="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          error={touched && !passwordOk}
        />
        {touched && !passwordOk ? (
          <p className="error">Минимум 8 символов</p>
        ) : null}

        {error ? <p className="error">{error}</p> : null}

        <button type="submit" disabled={!canSubmit}>
          Войти
        </button>
      </form>

      <div className="demo-accounts">
        <p className="muted">Демо-аккаунты (нужен работающий API и сиды в БД):</p>
        <ul>
          {DEMO_ACCOUNTS.map((acc) => (
            <li key={acc.email}>
              <span>
                <strong>{acc.label}:</strong> {acc.email}
              </span>
              <button type="button" className="linkish" onClick={() => fillDemo(acc)}>
                Подставить
              </button>
              <button type="button" onClick={() => loginDemo(acc)}>
                Войти
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
