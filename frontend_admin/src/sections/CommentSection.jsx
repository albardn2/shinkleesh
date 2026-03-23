import RouteCard from '../components/RouteCard'

export default function CommentSection({ token, onTokenReceived }) {
  return (
    <section>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 rounded-full bg-violet-500" />
          <h2 className="text-2xl font-bold text-slate-800">Comments</h2>
        </div>
        <p className="text-slate-500 text-sm pl-4">
          Create, read, update, and delete comments on posts. All endpoints require authentication.
          Only comment owners can edit; owners and admins can delete.
        </p>
      </div>

      <div className="space-y-4">
        <RouteCard
          id="comments-list"
          method="GET"
          path="/comments"
          title="List Comments"
          description="Fetch a paginated list of comments. Filter by post UUID, H3 tile, or user UUID."
          queryFields={[
            { name: 'post_uuid', label: 'Post UUID (filter)', placeholder: 'e.g. 550e8400-e29b-...', optional: true },
            { name: 'h3_l7', label: 'H3 Level-7 Tile', placeholder: 'e.g. 872a1072dffffff', optional: true },
            { name: 'user_uuid', label: 'User UUID (filter)', placeholder: 'e.g. 550e8400-e29b-...', optional: true },
            { name: 'page', label: 'Page', placeholder: '1', optional: true },
            { name: 'per_page', label: 'Per Page', placeholder: '20', optional: true },
          ]}
          requiresAuth
          token={token}
          onTokenReceived={onTokenReceived}
        />

        <RouteCard
          id="comments-create"
          method="POST"
          path="/comments"
          title="Create Comment"
          description="Post a comment on a post at a given location. H3 index and PostGIS geometry are auto-computed from lat/lng."
          fields={[
            { name: 'post_uuid', label: 'Post UUID', placeholder: 'e.g. 550e8400-e29b-41d4-a716-446655440000' },
            { name: 'message', label: 'Message', type: 'textarea', placeholder: 'Write a comment…' },
            { name: 'lat', label: 'Latitude', placeholder: 'e.g. 37.7749' },
            { name: 'lng', label: 'Longitude', placeholder: 'e.g. -122.4194' },
          ]}
          requiresAuth
          token={token}
          onTokenReceived={onTokenReceived}
        />

        <RouteCard
          id="comment-get"
          method="GET"
          path="/comments/:comment_uuid"
          title="Get Comment"
          description="Retrieve a single comment by its UUID."
          fields={[
            { name: 'comment_uuid', label: 'Comment UUID', placeholder: 'e.g. 550e8400-e29b-41d4-a716-446655440000' },
          ]}
          requiresAuth
          token={token}
          onTokenReceived={onTokenReceived}
        />

        <RouteCard
          id="comment-update"
          method="PUT"
          path="/comments/:comment_uuid"
          title="Update Comment"
          description="Update a comment's message. Only the comment owner can perform this action."
          fields={[
            { name: 'comment_uuid', label: 'Comment UUID', placeholder: 'e.g. 550e8400-e29b-41d4-a716-446655440000' },
            { name: 'message', label: 'Message', type: 'textarea', placeholder: 'Updated message', optional: true },
          ]}
          requiresAuth
          token={token}
          onTokenReceived={onTokenReceived}
        />

        <RouteCard
          id="comment-delete"
          method="DELETE"
          path="/comments/:comment_uuid"
          title="Delete Comment"
          description="Soft-delete a comment. Allowed by the comment owner or any admin."
          fields={[
            { name: 'comment_uuid', label: 'Comment UUID', placeholder: 'e.g. 550e8400-e29b-41d4-a716-446655440000' },
          ]}
          requiresAuth
          token={token}
          onTokenReceived={onTokenReceived}
        />
      </div>
    </section>
  )
}
