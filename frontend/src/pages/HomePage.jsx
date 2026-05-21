import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function HomePage() {
  const { me } = useAuth()
  const prefCity = me?.profile?.city_name

  return (
    <section>
      <h1>Добро пожаловать</h1>
      <p className="lead">
        Веб-сервис каталога образовательных учреждений для поступления. Разделы: города с
        агрегированными отзывами, каталог учреждений, избранное и личные предпочтения для фильтрации.
      </p>
      <ul className="tiles">
        <li>
          <Link to="/cities">Города и рейтинги</Link>
        </li>
        <li>
          <Link to="/catalog">Каталог учреждений</Link>
        </li>
        <li>
          <Link to="/favorites">Избранное</Link>
        </li>
        <li>
          <Link to="/profile">Профиль и предпочтения</Link>
        </li>
      </ul>
      {prefCity ? (
        <p className="muted">
          В профиле указан город: <strong>{prefCity}</strong>. Его можно изменить в разделе «Профиль».
        </p>
      ) : null}
    </section>
  )
}
