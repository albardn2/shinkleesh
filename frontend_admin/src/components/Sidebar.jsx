import React from 'react'
import { useState } from 'react'
import { clearToken, decodeJwtPayload } from '../api'

const NAV_SECTIONS = [
  {
    label: 'Public',
    id: 'public',
    items: [
      { id: 'register', label: 'Register', method: 'POST' },
      { id: 'login', label: 'Login', method: 'POST' },
      { id: 'logout', label: 'Logout', method: 'POST' },
    ],
  },
  {
    label: 'My Account',
    id: 'account',
    items: [
      { id: 'me-get', label: 'Get Profile', method: 'GET' },
      { id: 'me-put', label: 'Update Profile', method: 'PUT' },
    ],
  },
  {
    label: 'Admin',
    id: 'admin',
    items: [
      { id: 'users-list', label: 'List Users', method: 'GET' },
      { id: 'users-create', label: 'Create User', method: 'POST' },
      { id: 'user-get', label: 'Get User', method: 'GET' },
      { id: 'user-update', label: 'Update User', method: 'PUT' },
      { id: 'user-delete', label: 'Delete User', method: 'DELETE' },
    ],
  },
  {
    label: 'Posts',
    id: 'posts',
    items: [
      { id: 'feed-new', label: 'New Feed', method: 'GET' },
      { id: 'feed-hot', label: 'Hot Feed', method: 'GET' },
      { id: 'posts-list', label: 'List Posts', method: 'GET' },
      { id: 'posts-create', label: 'Create Post', method: 'POST' },
      { id: 'post-get', label: 'Get Post', method: 'GET' },
      { id: 'post-update', label: 'Update Post', method: 'PUT' },
      { id: 'post-delete', label: 'Delete Post', method: 'DELETE' },
    ],
  },
  {
    label: 'Comments',
    id: 'comments',
    items: [
      { id: 'comments-list', label: 'List Comments', method: 'GET' },
      { id: 'comments-create', label: 'Create Comment', method: 'POST' },
      { id: 'comment-get', label: 'Get Comment', method: 'GET' },
      { id: 'comment-update', label: 'Update Comment', method: 'PUT' },
      { id: 'comment-delete', label: 'Delete Comment', method: 'DELETE' },
    ],
  },
  {
    label: 'Votes',
    id: 'votes',
    items: [
      { id: 'vote-cast', label: 'Cast / Change Vote', method: 'POST' },
      { id: 'vote-remove', label: 'Remove Vote', method: 'DELETE' },
    ],
  },
]

const METHOD_COLORS = {
  GET: 'text-emerald-400',
  POST: 'text-blue-400',
  PUT: 'text-amber-400',
  DELETE: 'text-red-400',
}

function TokenStatus({ token, onClear, onSet }) {
  const [pasteValue, setPasteValue] = useState('')

  if (token) {
    const payload = decodeJwtPayload(token)
    let expiryText = null
    if (payload?.exp) {
      const expDate = new Date(payload.exp * 1000)
      const now = new Date()
      const diffMs = expDate - now
      if (diffMs < 0) {
        expiryText = 'Expired'
      } else {
        const diffMin = Math.floor(diffMs / 60000)
        if (diffMin < 60) expiryText = `Expires in ${diffMin}m`
        else expiryText = `Expires in ${Math.floor(diffMin / 60)}h ${diffMin % 60}m`
      }
    }
    const isExpired = payload?.exp && new Date(payload.exp * 1000) < new Date()

    return (
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isExpired ? 'bg-red-500' : 'bg-emerald-500'}`} />
          <span className="text-xs font-medium text-slate-300">
            {isExpired ? 'Token Expired' : 'Token Active'}
          </span>
        </div>
        {expiryText && (
          <p className={`text-xs mb-2 ${isExpired ? 'text-red-400' : 'text-slate-500'}`}>
            {expiryText}
          </p>
        )}
        {payload?.sub && (
          <p className="text-xs text-slate-500 mb-1 truncate">
            Sub: {payload.sub}
          </p>
        )}
        {payload?.scope && (
          <p className="text-xs text-slate-500 mb-2 truncate">
            Scope: {payload.scope}
          </p>
        )}
        <p className="text-xs text-slate-600 font-mono truncate mb-3" title={token}>
          {token.slice(0, 24)}…
        </p>
        <button
          onClick={onClear}
          className="w-full text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-red-900/60 text-slate-300 hover:text-red-300 transition-colors duration-150"
        >
          Clear Token
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 border-t border-slate-700">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full flex-shrink-0 bg-red-500" />
        <span className="text-xs font-medium text-slate-400">No Token</span>
      </div>
      <p className="text-xs text-slate-500 mb-2">Paste a JWT to authenticate:</p>
      <textarea
        value={pasteValue}
        onChange={e => setPasteValue(e.target.value)}
        placeholder="eyJhbGci..."
        rows={3}
        className="w-full text-xs font-mono bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
      />
      <button
        onClick={() => { if (pasteValue.trim()) { onSet(pasteValue.trim()); setPasteValue('') } }}
        className="w-full mt-2 text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors duration-150"
      >
        Use Token
      </button>
    </div>
  )
}

export default function Sidebar({ activeSection, onNavigate, token, onTokenChange }) {
  const handleClear = () => {
    clearToken()
    onTokenChange(null)
  }

  const handleSet = (t) => {
    onTokenChange(t)
  }

  return (
    <aside className="w-64 flex-shrink-0 h-screen bg-slate-900 flex flex-col fixed left-0 top-0 z-10 shadow-xl">
      {/* Header */}
      <div className="px-5 py-6 border-b border-slate-700/60">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-900/50">
            S
          </div>
          <h1 className="text-white font-semibold text-lg tracking-tight">Shinkleesh</h1>
        </div>
        <p className="text-slate-500 text-xs pl-11">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3">
        {NAV_SECTIONS.map(section => (
          <div key={section.id} className="mb-5">
            <button
              onClick={() => onNavigate(section.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-150 group ${
                activeSection === section.id
                  ? 'bg-indigo-600/20 text-indigo-400'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-xs font-semibold uppercase tracking-widest">
                {section.label}
              </span>
            </button>
            <ul className="mt-1 space-y-0.5 pl-2">
              {section.items.map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onNavigate(section.id)
                      // Scroll to the card
                      setTimeout(() => {
                        const el = document.getElementById(`card-${item.id}`)
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }, 50)
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-md flex items-center gap-2 text-sm text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors duration-100"
                  >
                    <span className={`text-xs font-mono font-bold ${METHOD_COLORS[item.method]}`}>
                      {item.method.slice(0, 3)}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Token status */}
      <TokenStatus token={token} onClear={handleClear} onSet={handleSet} />
    </aside>
  )
}
