import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Layout() {
  const { me, logout, isAdmin } = useAuth()

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="brand">
          Каталог учреждений
        </Link>
        <nav className="nav">
          <NavLink to="/" end>
            Главная
          </NavLink>
          <NavLink to="/cities">Города</NavLink>
          <NavLink to="/catalog">Каталог</NavLink>
          <NavLink to="/favorites">Избранное</NavLink>
          <NavLink to="/profile">Профиль</NavLink>
          {isAdmin ? <NavLink to="/admin/institution">Админ</NavLink> : null}
          <button type="button" className="linkish" onClick={logout}>
            Выход
          </button>
        </nav>
        <div className="who">{me?.user?.email}</div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
