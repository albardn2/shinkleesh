import React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { apiRequest } from '../api'
import { timeAgo } from '../components/TimeAgo'
import PostDetailPage from './PostDetailPage'

function VoteButtons({ voteCount, onUpvote, onDownvote }) {
  return (
    <div className="flex flex-col items-center gap-0.5 mr-3 flex-shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); onUpvote() }}
        className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 transition-colors"
        title="Upvote"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <span className={`text-sm font-bold tabular-nums ${
        voteCount > 0 ? 'text-emerald-600' : voteCount < 0 ? 'text-red-500' : 'text-slate-500'
      }`}>
        {voteCount || 0}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onDownvote() }}
        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
        title="Downvote"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  )
}

function PostCard({ post, onClick, token, location, onVoteUpdate }) {
  const handleVote = async (voteType) => {
    const result = await apiRequest({
      method: 'POST',
      path: '/votes',
      body: { target_type: 'post', target_uuid: post.uuid, vote_type: voteType },
      token,
    })
    if (result.status >= 200 && result.status < 300) {
      onVoteUpdate(post.uuid, voteType)
    }
  }

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 hover:shadow-md transition-shadow duration-200 cursor-pointer"
    >
      <div className="flex">
        <VoteButtons
          voteCount={post.vote_count}
          onUpvote={() => handleVote('upvote')}
          onDownvote={() => handleVote('downvote')}
        />
        <div className="flex-1 min-w-0">
          <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {post.message}
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
            <span>{timeAgo(post.created_at)}</span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {post.comment_count || 0} {post.comment_count === 1 ? 'reply' : 'replies'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreatePostForm({ token, location, onPostCreated }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
    setError(null)
    const result = await apiRequest({
      method: 'POST',
      path: '/posts',
      body: { message: message.trim(), lat: location.lat, lng: location.lng },
      token,
    })
    setLoading(false)
    if (result.status >= 200 && result.status < 300) {
      setMessage('')
      onPostCreated()
    } else {
      setError(result.data?.description || result.data?.error || 'Failed to create post')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="What's happening nearby?"
        rows={3}
        className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-colors resize-none"
      />
      {error && (
        <div className="mt-2 bg-red-500/10 border border-red-500/30 text-red-600 text-xs rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-slate-400">
          Posting at {location.lat}, {location.lng}
        </span>
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  )
}

export default function HomePage({ token, location }) {
  const [feedType, setFeedType] = useState('new')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedPostUuid, setSelectedPostUuid] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const fetchFeed = useCallback(async () => {
    setLoading(true)
    const result = await apiRequest({
      method: 'GET',
      path: `/posts/feed/${feedType}`,
      query: { lat: location.lat, lng: location.lng },
      token,
    })
    setLoading(false)
    if (result.status >= 200 && result.status < 300) {
      setPosts(result.data?.posts || result.data || [])
    }
  }, [feedType, location.lat, location.lng, token])

  useEffect(() => {
    fetchFeed()
  }, [fetchFeed])

  const handleVoteUpdate = (postUuid, voteType) => {
    setPosts(prev => prev.map(p => {
      if (p.uuid !== postUuid) return p
      const delta = voteType === 'upvote' ? 1 : -1
      return { ...p, vote_count: (p.vote_count || 0) + delta }
    }))
  }

  if (selectedPostUuid) {
    return (
      <PostDetailPage
        postUuid={selectedPostUuid}
        token={token}
        location={location}
        onBack={() => { setSelectedPostUuid(null); fetchFeed() }}
      />
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Header with feed toggle and create button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex bg-slate-200 rounded-lg p-0.5">
          <button
            onClick={() => setFeedType('new')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              feedType === 'new'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            New
          </button>
          <button
            onClick={() => setFeedType('hot')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              feedType === 'hot'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Hot
          </button>
        </div>
        <button
          onClick={() => setShowCreateForm(v => !v)}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Post
        </button>
      </div>

      {/* Create post form */}
      {showCreateForm && (
        <div className="mb-6">
          <CreatePostForm
            token={token}
            location={location}
            onPostCreated={() => { setShowCreateForm(false); fetchFeed() }}
          />
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading feed...
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400 text-sm">No posts yet. Be the first to post!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <PostCard
              key={post.uuid}
              post={post}
              onClick={() => setSelectedPostUuid(post.uuid)}
              token={token}
              location={location}
              onVoteUpdate={handleVoteUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
