import React from 'react'
import { useState, useEffect } from 'react'
import { apiRequest } from '../api'

export default function ProfilePage({ token, location, onLocationChange }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formValues, setFormValues] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)
  const [locValues, setLocValues] = useState({ lat: location.lat, lng: location.lng })

  useEffect(() => {
    fetchProfile()
  }, [token])

  const fetchProfile = async () => {
    setLoading(true)
    const result = await apiRequest({ method: 'GET', path: '/auth/me', token })
    if (result.status >= 200 && result.status < 300) {
      setProfile(result.data)
      setFormValues({
        username: result.data.username || '',
        email: result.data.email || '',
        phone_number: result.data.phone_number || '',
        language: result.data.language || '',
      })
    }
    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveMsg(null)
    const result = await apiRequest({
      method: 'PUT',
      path: '/auth/me',
      body: formValues,
      token,
    })
    setSaving(false)
    if (result.status >= 200 && result.status < 300) {
      setSaveMsg({ type: 'success', text: 'Profile updated!' })
      setEditing(false)
      fetchProfile()
    } else {
      setSaveMsg({ type: 'error', text: result.data?.description || result.data?.error || 'Update failed' })
    }
  }

  const handleLocationSave = () => {
    onLocationChange({ lat: locValues.lat, lng: locValues.lng })
    setSaveMsg({ type: 'success', text: 'Location updated!' })
    setTimeout(() => setSaveMsg(null), 2000)
  }

  const set = (k, v) => setFormValues(prev => ({ ...prev, [k]: v }))

  const inputClass = "w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-colors"

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading profile...
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <p className="text-slate-500 text-sm">Failed to load profile.</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="bg-indigo-600 h-20" />
        <div className="px-6 pb-6">
          <div className="w-16 h-16 rounded-full bg-indigo-500 border-4 border-white -mt-8 flex items-center justify-center text-white text-xl font-bold shadow-lg">
            {(profile.username || '?')[0].toUpperCase()}
          </div>

          {saveMsg && (
            <div className={`mt-4 text-xs rounded-lg px-3 py-2 ${
              saveMsg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600'
                : 'bg-red-500/10 border border-red-500/30 text-red-600'
            }`}>
              {saveMsg.text}
            </div>
          )}

          {editing ? (
            <form onSubmit={handleSave} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Username</label>
                <input type="text" value={formValues.username} onChange={e => set('username', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                <input type="email" value={formValues.email} onChange={e => set('email', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Phone Number</label>
                <input type="text" value={formValues.phone_number} onChange={e => set('phone_number', e.target.value)} className={inputClass} placeholder="+1 555 000 0000" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Language</label>
                <input type="text" value={formValues.language} onChange={e => set('language', e.target.value)} className={inputClass} placeholder="en" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">New Password</label>
                <input type="password" value={formValues.password || ''} onChange={e => set('password', e.target.value)} className={inputClass} placeholder="Leave blank to keep current" />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-4">
              <h2 className="text-lg font-bold text-slate-900">{profile.username}</h2>
              <div className="mt-3 space-y-2">
                {profile.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400 w-24 flex-shrink-0">Email</span>
                    <span className="text-slate-700">{profile.email}</span>
                  </div>
                )}
                {profile.phone_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400 w-24 flex-shrink-0">Phone</span>
                    <span className="text-slate-700">{profile.phone_number}</span>
                  </div>
                )}
                {profile.language && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400 w-24 flex-shrink-0">Language</span>
                    <span className="text-slate-700">{profile.language}</span>
                  </div>
                )}
                {profile.permission_scope && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400 w-24 flex-shrink-0">Role</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                      {profile.permission_scope}
                    </span>
                  </div>
                )}
                {profile.karma !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400 w-24 flex-shrink-0">Karma</span>
                    <span className="text-slate-700">{profile.karma}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setEditing(true)}
                className="mt-4 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Location Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Feed Location</h3>
        <p className="text-xs text-slate-400 mb-4">Set the coordinates used for loading the newsfeed.</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Latitude</label>
            <input
              type="text"
              value={locValues.lat}
              onChange={e => setLocValues(p => ({ ...p, lat: e.target.value }))}
              className={inputClass}
              placeholder="37.7749"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Longitude</label>
            <input
              type="text"
              value={locValues.lng}
              onChange={e => setLocValues(p => ({ ...p, lng: e.target.value }))}
              className={inputClass}
              placeholder="-122.4194"
            />
          </div>
        </div>
        <button
          onClick={handleLocationSave}
          className="mt-3 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
        >
          Update Location
        </button>
      </div>
    </div>
  )
}
