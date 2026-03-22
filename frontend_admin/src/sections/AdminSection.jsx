import RouteCard from '../components/RouteCard'

const PERMISSION_SCOPE_OPTIONS = [
  { value: '', label: '(not set)' },
  { value: 'superuser', label: 'superuser' },
  { value: 'admin', label: 'admin' },
  { value: 'moderator', label: 'moderator' },
]

const IS_BANNED_OPTIONS = [
  { value: '', label: '(not set)' },
  { value: 'true', label: 'true' },
  { value: 'false', label: 'false' },
]

export default function AdminSection({ token, onTokenReceived }) {
  return (
    <section>
      {/* Section header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 rounded-full bg-red-500" />
          <h2 className="text-2xl font-bold text-slate-800">Admin</h2>
        </div>
        <p className="text-slate-500 text-sm pl-4">
          Requires a JWT with admin scope. Use these endpoints to manage users — list, create, inspect, update, and delete accounts on the platform.
        </p>
      </div>

      <div className="space-y-4">
        <RouteCard
          id="users-list"
          method="GET"
          path="/auth/users"
          title="List Users"
          description="Fetch a paginated list of users. Use query parameters to filter by username, email, ban status, or permission scope."
          queryFields={[
            { name: 'page', label: 'Page', placeholder: '1', optional: true },
            { name: 'per_page', label: 'Per Page', placeholder: '20', optional: true },
            { name: 'username', label: 'Username (filter)', placeholder: 'search username', optional: true },
            { name: 'email', label: 'Email (filter)', placeholder: 'search email', optional: true },
            {
              name: 'is_banned',
              label: 'Is Banned',
              type: 'select',
              options: IS_BANNED_OPTIONS,
              optional: true,
            },
            {
              name: 'permission_scope',
              label: 'Permission Scope',
              type: 'select',
              options: PERMISSION_SCOPE_OPTIONS,
              optional: true,
            },
          ]}
          requiresAuth
          token={token}
          onTokenReceived={onTokenReceived}
        />

        <RouteCard
          id="users-create"
          method="POST"
          path="/auth/users"
          title="Create User"
          description="Create a new user account as an admin. Username and password are required."
          fields={[
            { name: 'username', label: 'Username', placeholder: 'e.g. johndoe' },
            { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
            { name: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com', optional: true },
            { name: 'phone_number', label: 'Phone Number', placeholder: '+1 555 000 0000', optional: true },
            { name: 'language', label: 'Language', placeholder: 'en', optional: true },
          ]}
          requiresAuth
          token={token}
          onTokenReceived={onTokenReceived}
        />

        <RouteCard
          id="user-get"
          method="GET"
          path="/auth/user/:uuid"
          title="Get User"
          description="Retrieve a specific user's full profile by their UUID. The UUID is substituted into the path."
          fields={[
            { name: 'uuid', label: 'User UUID', placeholder: 'e.g. 550e8400-e29b-41d4-a716-446655440000' },
          ]}
          requiresAuth
          token={token}
          onTokenReceived={onTokenReceived}
        />

        <RouteCard
          id="user-update"
          method="PUT"
          path="/auth/user/:uuid"
          title="Update User"
          description="Update a user's details by UUID. You can change username, email, phone, language, permission scope, and ban status. Empty fields are omitted."
          fields={[
            { name: 'uuid', label: 'User UUID', placeholder: 'e.g. 550e8400-e29b-41d4-a716-446655440000' },
            { name: 'username', label: 'Username', placeholder: 'new username', optional: true },
            { name: 'email', label: 'Email', type: 'email', placeholder: 'new@example.com', optional: true },
            { name: 'phone_number', label: 'Phone Number', placeholder: '+1 555 000 0000', optional: true },
            { name: 'language', label: 'Language', placeholder: 'en', optional: true },
            {
              name: 'permission_scope',
              label: 'Permission Scope',
              type: 'select',
              options: PERMISSION_SCOPE_OPTIONS,
              optional: true,
            },
            {
              name: 'is_banned',
              label: 'Is Banned',
              type: 'select',
              options: IS_BANNED_OPTIONS,
              optional: true,
            },
            { name: 'ban_reason', label: 'Ban Reason', placeholder: 'Reason for ban', optional: true },
          ]}
          requiresAuth
          token={token}
          onTokenReceived={onTokenReceived}
        />

        <RouteCard
          id="user-delete"
          method="DELETE"
          path="/auth/user/:uuid"
          title="Delete User"
          description="Permanently delete a user by UUID. This action is irreversible."
          fields={[
            { name: 'uuid', label: 'User UUID', placeholder: 'e.g. 550e8400-e29b-41d4-a716-446655440000' },
          ]}
          requiresAuth
          token={token}
          onTokenReceived={onTokenReceived}
        />
      </div>
    </section>
  )
}
