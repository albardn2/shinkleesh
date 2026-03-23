import React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { apiRequest } from '../api'
import { timeAgo } from '../components/TimeAgo'

function VoteButtons({ voteCount, onUpvote, onDownvote, small }) {
  const iconSize = small ? 'w-4 h-4' : 'w-5 h-5'
  const textSize = small ? 'text-xs' : 'text-sm'
  return (
    <div className="flex flex-col items-center gap-0.5 mr-3 flex-shrink-0">
      <button
        onClick={onUpvote}
        className="p-1 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 transition-colors"
      >
        <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <span className={`${textSize} font-bold tabular-nums ${
        voteCount > 0 ? 'text-emerald-600' : voteCount < 0 ? 'text-red-500' : 'text-slate-500'
      }`}>
        {voteCount || 0}
      </span>
      <button
        onClick={onDownvote}
        className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
      >
        <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  )
}

export default function PostDetailPage({ postUuid, token, location, onBack }) {
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentError, setCommentError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [postRes, commentsRes] = await Promise.all([
      apiRequest({ method: 'GET', path: `/posts/${postUuid}`, token }),
      apiRequest({ method: 'GET', path: '/comments', query: { post_uuid: postUuid }, token }),
    ])
    if (postRes.status >= 200 && postRes.status < 300) {
      setPost(postRes.data)
    }
    if (commentsRes.status >= 200 && commentsRes.status < 300) {
      setComments(commentsRes.data?.comments || commentsRes.data || [])
    }
    setLoading(false)
  }, [postUuid, token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleVotePost = async (voteType) => {
    const result = await apiRequest({
      method: 'POST',
      path: '/votes',
      body: { target_type: 'post', target_uuid: postUuid, vote_type: voteType },
      token,
    })
    if (result.status >= 200 && result.status < 300) {
      setPost(prev => prev ? {
        ...prev,
        vote_count: (prev.vote_count || 0) + (voteType === 'upvote' ? 1 : -1),
      } : prev)
    }
  }

  const handleVoteComment = async (commentUuid, voteType) => {
    const result = await apiRequest({
      method: 'POST',
      path: '/votes',
      body: { target_type: 'comment', target_uuid: commentUuid, vote_type: voteType },
      token,
    })
    if (result.status >= 200 && result.status < 300) {
      setComments(prev => prev.map(c => {
        if (c.uuid !== commentUuid) return c
        return { ...c, vote_count: (c.vote_count || 0) + (voteType === 'upvote' ? 1 : -1) }
      }))
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setCommentLoading(true)
    setCommentError(null)
    const result = await apiRequest({
      method: 'POST',
      path: '/comments',
      body: {
        post_uuid: postUuid,
        message: newComment.trim(),
        lat: location.lat,
        lng: location.lng,
      },
      token,
    })
    setCommentLoading(false)
    if (result.status >= 200 && result.status < 300) {
      setNewComment('')
      fetchData()
    } else {
      setCommentError(result.data?.description || result.data?.error || 'Failed to add comment')
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 text-center">
        <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <button onClick={onBack} className="text-sm text-indigo-600 hover:text-indigo-500 mb-4 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Feed
        </button>
        <p className="text-slate-500 text-sm">Post not found.</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="text-sm text-indigo-600 hover:text-indigo-500 mb-6 flex items-center gap-1 font-medium"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Feed
      </button>

      {/* Post */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 mb-6">
        <div className="flex">
          <VoteButtons
            voteCount={post.vote_count}
            onUpvote={() => handleVotePost('upvote')}
            onDownvote={() => handleVotePost('downvote')}
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
                {post.comment_count || 0} comments
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Comments header */}
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Comments ({comments.length})
      </h3>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-sm text-slate-400 mb-6">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-2 mb-6">
          {comments.map(comment => (
            <div key={comment.uuid} className="bg-white rounded-lg border border-slate-200/80 p-4">
              <div className="flex">
                <VoteButtons
                  voteCount={comment.vote_count}
                  onUpvote={() => handleVoteComment(comment.uuid, 'upvote')}
                  onDownvote={() => handleVoteComment(comment.uuid, 'downvote')}
                  small
                />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 text-sm whitespace-pre-wrap break-words">
                    {comment.message}
                  </p>
                  <span className="text-xs text-slate-400 mt-1 inline-block">
                    {timeAgo(comment.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add comment form */}
      <form onSubmit={handleSubmitComment} className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4">
        <textarea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-colors resize-none"
        />
        {commentError && (
          <div className="mt-2 bg-red-500/10 border border-red-500/30 text-red-600 text-xs rounded-lg px-3 py-2">
            {commentError}
          </div>
        )}
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={commentLoading || !newComment.trim()}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {commentLoading ? 'Posting...' : 'Comment'}
          </button>
        </div>
      </form>
    </div>
  )
}
