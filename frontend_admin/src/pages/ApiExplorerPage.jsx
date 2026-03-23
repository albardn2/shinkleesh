import React from 'react'
import { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import PublicSection from '../sections/PublicSection'
import AccountSection from '../sections/AccountSection'
import AdminSection from '../sections/AdminSection'
import PostSection from '../sections/PostSection'
import CommentSection from '../sections/CommentSection'
import VoteSection from '../sections/VoteSection'

const SECTIONS = ['public', 'account', 'admin', 'posts', 'comments', 'votes']

export default function ApiExplorerPage({ token, onTokenChange }) {
  const [activeSection, setActiveSection] = useState('public')
  const sectionRefs = {
    public: useRef(null),
    account: useRef(null),
    admin: useRef(null),
    posts: useRef(null),
    comments: useRef(null),
    votes: useRef(null),
  }

  const handleNavigate = (sectionId) => {
    setActiveSection(sectionId)
    setTimeout(() => {
      const el = sectionRefs[sectionId]?.current
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 30)
  }

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

  return (
    <div className="flex min-h-screen">
      <Sidebar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        token={token}
        onTokenChange={onTokenChange}
      />

      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-3xl mx-auto px-8 py-10 space-y-16">
          <div className="pb-2 border-b border-slate-200">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">API Explorer</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Test Shinkleesh backend endpoints directly from the browser. Token is stored in localStorage.
            </p>
          </div>

          <div ref={sectionRefs.public}>
            <PublicSection token={token} onTokenReceived={onTokenChange} />
          </div>
          <div ref={sectionRefs.account}>
            <AccountSection token={token} onTokenReceived={onTokenChange} />
          </div>
          <div ref={sectionRefs.admin}>
            <AdminSection token={token} onTokenReceived={onTokenChange} />
          </div>
          <div ref={sectionRefs.posts}>
            <PostSection token={token} onTokenReceived={onTokenChange} />
          </div>
          <div ref={sectionRefs.comments}>
            <CommentSection token={token} onTokenReceived={onTokenChange} />
          </div>
          <div ref={sectionRefs.votes}>
            <VoteSection token={token} onTokenReceived={onTokenChange} />
          </div>

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
