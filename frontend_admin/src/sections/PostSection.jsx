import React from 'react'
import RouteCard from '../components/RouteCard'

export default function PostSection({ token, onTokenReceived }) {
  return (
    <section>
      {/* Section header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 rounded-full bg-indigo-500" />
          <h2 className="text-2xl font-bold text-slate-800">Posts</h2>
        </div>
        <p className="text-slate-500 text-sm pl-4">
          Create, read, update, and delete posts. All endpoints require authentication.
          Only post owners can edit; owners and admins can delete.
        </p>
      </div>

      <div className="space-y-4">
        <RouteCard
          id="feed-new"
          method="GET"
          path="/posts/feed/new"
          title="New Feed"
          description="Location-based newsfeed sorted by newest. Expands to neighbouring H3 tiles when the user's tile has fewer than 20 posts."
          queryFields={[
            { name: 'lat', label: 'Latitude', placeholder: 'e.g. 37.7749' },
            { name: 'lng', label: 'Longitude', placeholder: 'e.g. -122.4194' },
            { name: 'page', label: 'Page', placeholder: '1', optional: true },
            { name: 'per_page', label: 'Per Page', placeholder: '20', optional: true },
          ]}
          requiresAuth
          token={token}
          onTokenReceived={onTokenReceived}
        />

        <RouteCard
          id="feed-hot"
          method="GET"
          path="/posts/feed/hot"
          title="Hot Feed"
          description="Location-based newsfeed sorted by hottest (total votes + comments). Expands to neighbouring H3 tiles when needed."
          queryFields={[
            { name: 'lat', label: 'Latitude', placeholder: 'e.g. 37.7749' },
            { name: 'lng', label: 'Longitude', placeholder: 'e.g. -122.4194' },
            { name: 'page', label: 'Page', placeholder: '1', optional: true },
            { name: 'per_page', label: 'Per Page', placeholder: '20', optional: true },
          ]}
          requiresAuth
          token={token}
          onTokenReceived={onTokenReceived}
        />

        <RouteCard
          id="posts-list"
          method="GET"
          path="/posts"
          title="List Posts"
          description="Fetch a paginated feed of posts. Filter by H3 tile or user UUID."
          queryFields={[
            { name: 'page', label: 'Page', placeholder: '1', optional: true },
            { name: 'per_page', label: 'Per Page', placeholder: '20', optional: true },
            { name: 'h3_l7', label: 'H3 Level-7 Tile', placeholder: 'e.g. 872a1072dffffff', optional: true },
            { name: 'user_uuid', label: 'User UUID (filter)', placeholder: 'e.g. 550e8400-e29b-...', optional: true },
          ]}
          requiresAuth
          token={token}
          onTokenReceived={onTokenReceived}
        />

        <RouteCard
          id="posts-create"
          method="POST"
          path="/posts"
          title="Create Post"
          description="Create a new post at a given location. The H3 index and PostGIS geometry are computed automatically from lat/lng."
          fields={[
            { name: 'message', label: 'Message', type: 'textarea', placeholder: 'What\'s happening nearby?' },
            { name: 'lat', label: 'Latitude', placeholder: 'e.g. 37.7749' },
            { name: 'lng', label: 'Longitude', placeholder: 'e.g. -122.4194' },
          ]}
          requiresAuth
          token={token}
          onTokenReceived={onTokenReceived}
        />

        <RouteCard
          id="post-get"
          method="GET"
          path="/posts/:post_uuid"
          title="Get Post"
          description="Retrieve a single post by its UUID."
          fields={[
            { name: 'post_uuid', label: 'Post UUID', placeholder: 'e.g. 550e8400-e29b-41d4-a716-446655440000' },
          ]}
          requiresAuth
          token={token}
          onTokenReceived={onTokenReceived}
        />

        <RouteCard
          id="post-update"
          method="PUT"
          path="/posts/:post_uuid"
          title="Update Post"
          description="Update a post's message. Only the post owner can perform this action."
          fields={[
            { name: 'post_uuid', label: 'Post UUID', placeholder: 'e.g. 550e8400-e29b-41d4-a716-446655440000' },
            { name: 'message', label: 'Message', type: 'textarea', placeholder: 'Updated message', optional: true },
          ]}
          requiresAuth
          token={token}
          onTokenReceived={onTokenReceived}
        />

        <RouteCard
          id="post-delete"
          method="DELETE"
          path="/posts/:post_uuid"
          title="Delete Post"
          description="Soft-delete a post. Allowed by the post owner or any admin."
          fields={[
            { name: 'post_uuid', label: 'Post UUID', placeholder: 'e.g. 550e8400-e29b-41d4-a716-446655440000' },
          ]}
          requiresAuth
          token={token}
          onTokenReceived={onTokenReceived}
        />
      </div>
    </section>
  )
}
