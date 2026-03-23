import React from 'react'
import { useState, useMemo } from 'react'
import LoginPage from './components/LoginPage'
import TopNav from './components/TopNav'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import ApiExplorerPage from './pages/ApiExplorerPage'
import AdminPage from './pages/AdminPage'
import { getToken, setToken, clearToken, decodeJwtPayload } from './api'

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [token, setTokenState] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const oauthToken = params.get('token')
    const oauthError = params.get('error')

    if (oauthToken) {
      setToken(oauthToken)
      window.history.replaceState({}, '', window.location.pathname)
      return oauthToken
    }

    if (oauthError) {
      window.history.replaceState({}, '', window.location.pathname)
    }

    return getToken()
  })

  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem('shinkleesh_location')
    if (saved) {
      try { return JSON.parse(saved) } catch { /* fall through */ }
    }
    return { lat: '37.7749', lng: '-122.4194' }
  })

  const handleLocationChange = (newLoc) => {
    setLocation(newLoc)
    localStorage.setItem('shinkleesh_location', JSON.stringify(newLoc))
  }

  const handleTokenChange = (newToken) => {
    if (newToken) {
      setToken(newToken)
    } else {
      clearToken()
    }
    setTokenState(newToken)
  }

  const handleLogout = () => {
    clearToken()
    setTokenState(null)
  }

  const isAdmin = useMemo(() => {
    if (!token) return false
    const payload = decodeJwtPayload(token)
    const scope = payload?.scope || ''
    return scope === 'superuser' || scope === 'admin'
  }, [token])

  if (!token) {
    return <LoginPage onLogin={handleTokenChange} />
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <TopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isAdmin={isAdmin}
        token={token}
        onLogout={handleLogout}
      />

      <div className="pt-16">
        {activeTab === 'home' && (
          <HomePage token={token} location={location} />
        )}
        {activeTab === 'profile' && (
          <ProfilePage token={token} location={location} onLocationChange={handleLocationChange} />
        )}
        {activeTab === 'explorer' && (
          <ApiExplorerPage token={token} onTokenChange={handleTokenChange} />
        )}
        {activeTab === 'admin' && (
          <AdminPage token={token} onTokenChange={handleTokenChange} />
        )}
      </div>
    </div>
  )
}
