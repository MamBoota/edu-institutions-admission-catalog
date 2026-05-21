import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import Layout from './components/Layout'
import GuestOnly from './components/GuestOnly'
import ProtectedRoute from './components/ProtectedRoute'
import AdminOnly from './components/AdminOnly'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CitiesPage from './pages/CitiesPage'
import CatalogPage from './pages/CatalogPage'
import InstitutionDetailPage from './pages/InstitutionDetailPage'
import FavoritesPage from './pages/FavoritesPage'
import ProfilePage from './pages/ProfilePage'
import AdminInstitutionPage from './pages/AdminInstitutionPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <GuestOnly>
                <LoginPage />
              </GuestOnly>
            }
          />
          <Route
            path="/register"
            element={
              <GuestOnly>
                <RegisterPage />
              </GuestOnly>
            }
          />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="cities" element={<CitiesPage />} />
              <Route path="catalog" element={<CatalogPage />} />
              <Route path="catalog/:id" element={<InstitutionDetailPage />} />
              <Route path="favorites" element={<FavoritesPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route
                path="admin/institution"
                element={
                  <AdminOnly>
                    <AdminInstitutionPage />
                  </AdminOnly>
                }
              />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
