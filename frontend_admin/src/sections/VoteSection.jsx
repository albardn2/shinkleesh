import React from 'react'
import RouteCard from '../components/RouteCard'

export default function VoteSection({ token, onTokenReceived }) {
  return (
    <section>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 rounded-full bg-rose-500" />
          <h2 className="text-2xl font-bold text-slate-800">Votes</h2>
        </div>
        <p className="text-slate-500 text-sm pl-4">
          Upvote or downvote posts and comments. Each user may cast one vote per target;
          casting again in the opposite direction flips the vote. All endpoints require authentication.
        </p>
      </div>

      <div className="space-y-4">
        <RouteCard
          id="vote-cast"
          method="POST"
          path="/votes"
          title="Cast / Change Vote"
          description="Upvote or downvote a post or comment. If you have already voted the same way this is a no-op. Voting the opposite way flips your existing vote."
          fields={[
            {
              name: 'target_type',
              label: 'Target Type',
              type: 'select',
              options: [
                { value: 'post', label: 'Post' },
                { value: 'comment', label: 'Comment' },
              ],
            },
            { name: 'target_uuid', label: 'Target UUID', placeholder: 'e.g. 550e8400-e29b-41d4-a716-446655440000' },
            {
              name: 'vote_type',
              label: 'Vote Type',
              type: 'select',
              options: [
                { value: 'upvote', label: 'Upvote' },
                { value: 'downvote', label: 'Downvote' },
              ],
            },
          ]}
          requiresAuth
          token={token}
          onTokenReceived={onTokenReceived}
        />

        <RouteCard
          id="vote-remove"
          method="DELETE"
          path="/votes/:target_type/:target_uuid"
          title="Remove Vote"
          description="Remove your existing vote from a post or comment. The target's vote count is adjusted accordingly."
          fields={[
            {
              name: 'target_type',
              label: 'Target Type',
              type: 'select',
              options: [
                { value: 'post', label: 'Post' },
                { value: 'comment', label: 'Comment' },
              ],
            },
            { name: 'target_uuid', label: 'Target UUID', placeholder: 'e.g. 550e8400-e29b-41d4-a716-446655440000' },
          ]}
          requiresAuth
          token={token}
          onTokenReceived={onTokenReceived}
        />
      </div>
    </section>
  )
}
