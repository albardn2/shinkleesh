import React from 'react'
import AdminSection from '../sections/AdminSection'

export default function AdminPage({ token, onTokenChange }) {
  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <div className="pb-2 border-b border-slate-200 mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Manage users, permissions, and moderation.
        </p>
      </div>
      <AdminSection token={token} onTokenReceived={onTokenChange} />
    </div>
  )
}
