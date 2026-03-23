import { useState, useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar'
import LoginPage from './components/LoginPage'
import PublicSection from './sections/PublicSection'
import AccountSection from './sections/AccountSection'
import AdminSection from './sections/AdminSection'
import PostSection from './sections/PostSection'
import CommentSection from './sections/CommentSection'
import { getToken, setToken, clearToken } from './api'

const SECTIONS = ['public', 'account', 'admin', 'posts', 'comments']

export default function App() {
  const [activeSection, setActiveSection] = useState('public')
  const [token, setTokenState] = useState(() => {
    // Handle OAuth callback: pick up ?token= from the URL
    const params = new URLSearchParams(window.location.search)
    const oauthToken = params.get('token')
    const oauthError = params.get('error')

    if (oauthToken) {
      setToken(oauthToken)
      window.history.replaceState({}, '', window.location.pathname)
      return oauthToken
    }

    if (oauthError) {
      // Clear the param so it doesn't linger; the LoginPage will show nothing extra
      window.history.replaceState({}, '', window.location.pathname)
    }

    return getToken()
  })
  const sectionRefs = {
    public: useRef(null),
    account: useRef(null),
    admin: useRef(null),
    posts: useRef(null),
    comments: useRef(null),
  }

  const handleTokenChange = (newToken) => {
    if (newToken) {
      setToken(newToken)
    } else {
      clearToken()
    }
    setTokenState(newToken)
  }

  const handleNavigate = (sectionId) => {
    setActiveSection(sectionId)
    setTimeout(() => {
      const el = sectionRefs[sectionId]?.current
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 30)
  }

  // Intersection observer to track which section is in view
  useEffect(() => {
    const observers = SECTIONS.map(id => {
      const el = sectionRefs[id]?.current
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id)
        },
        { threshold: 0.15 }
      )
      obs.observe(el)
      return obs
    }).filter(Boolean)

    return () => observers.forEach(o => o.disconnect())
  }, [])

  if (!token) {
    return <LoginPage onLogin={handleTokenChange} />
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        token={token}
        onTokenChange={handleTokenChange}
      />

      {/* Main content — offset by sidebar width */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-3xl mx-auto px-8 py-10 space-y-16">
          {/* Page header */}
          <div className="pb-2 border-b border-slate-200">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">API Explorer</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Test Shinkleesh backend endpoints directly from the browser. Token is stored in localStorage.
            </p>
          </div>

          {/* Sections */}
          <div ref={sectionRefs.public}>
            <PublicSection token={token} onTokenReceived={handleTokenChange} />
          </div>

          <div ref={sectionRefs.account}>
            <AccountSection token={token} onTokenReceived={handleTokenChange} />
          </div>

          <div ref={sectionRefs.admin}>
            <AdminSection token={token} onTokenReceived={handleTokenChange} />
          </div>

          <div ref={sectionRefs.posts}>
            <PostSection token={token} onTokenReceived={handleTokenChange} />
          </div>

          <div ref={sectionRefs.comments}>
            <CommentSection token={token} onTokenReceived={handleTokenChange} />
          </div>

          {/* Footer */}
          <div className="pt-4 pb-10 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-400">
              Shinkleesh Admin Panel &mdash; requests proxied to{' '}
              <code className="text-slate-500 bg-slate-100 px-1 py-0.5 rounded">http://localhost:5000</code>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
