import React from 'react'
import { decodeJwtPayload } from '../api'

export default function TopNav({ activeTab, onTabChange, isAdmin, token, onLogout }) {
  const payload = decodeJwtPayload(token)
  const username = payload?.username || payload?.sub || 'User'

  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'profile', label: 'Profile' },
    ...(isAdmin ? [
      { id: 'explorer', label: 'API Explorer' },
      { id: 'admin', label: 'Admin' },
    ] : []),
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-slate-900 z-50 flex items-center px-6 shadow-lg">
      {/* Logo */}
      <div className="flex items-center gap-3 mr-10">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-900/50">
          S
        </div>
        <span className="text-white font-semibold text-lg tracking-tight">Shinkleesh</span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
              activeTab === tab.id
                ? 'bg-indigo-600/20 text-indigo-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-4">
        <span className="text-sm text-slate-400">{username}</span>
        <button
          onClick={onLogout}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-red-300 transition-colors duration-150"
        >
          Log out
        </button>
      </div>
    </nav>
  )
}
