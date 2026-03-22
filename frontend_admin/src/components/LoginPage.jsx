import { useState } from 'react'
import { apiRequest, setToken } from '../api'

export default function LoginPage({ onLogin }) {
  const [values, setValues] = useState({ username_or_email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setValues(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await apiRequest({
      method: 'POST',
      path: '/auth/login',
      body: values,
    })
    setLoading(false)
    if (result.status === 200 && result.data?.access_token) {
      setToken(result.data.access_token)
      onLogin(result.data.access_token)
    } else {
      setError(result.data?.description || result.data?.msg || result.data?.error || 'Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white text-2xl font-black mb-4">
            S
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Shinkleesh</h1>
          <p className="text-slate-400 text-sm mt-1">Admin Panel</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
          <h2 className="text-white font-semibold text-lg mb-6">Sign in</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Username or Email
              </label>
              <input
                type="text"
                autoFocus
                required
                value={values.username_or_email}
                onChange={e => set('username_or_email', e.target.value)}
                placeholder="admin"
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3.5 py-2.5 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={values.password}
                onChange={e => set('password', e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3.5 py-2.5 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg py-2.5 transition-colors mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Requests proxied to{' '}
          <code className="text-slate-500">localhost:5000</code>
        </p>
      </div>
    </div>
  )
}
