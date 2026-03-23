import React from 'react'
import RouteCard from '../components/RouteCard'

export default function PublicSection({ token, onTokenReceived }) {
  return (
    <section>
      {/* Section header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 rounded-full bg-indigo-500" />
          <h2 className="text-2xl font-bold text-slate-800">Public Routes</h2>
        </div>
        <p className="text-slate-500 text-sm pl-4">
          No authentication required. Use the Login endpoint to obtain a JWT token — it will be automatically saved and used for authenticated requests.
        </p>
      </div>

      <div className="space-y-4">
        <RouteCard
          id="register"
          method="POST"
          path="/auth/register"
          title="Register"
          description="Create a new user account. Username and password are required. Email, phone number, and language are optional."
          fields={[
            { name: 'username', label: 'Username', placeholder: 'e.g. johndoe' },
            { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
            { name: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com', optional: true },
            { name: 'phone_number', label: 'Phone Number', placeholder: '+1 555 000 0000', optional: true },
            { name: 'language', label: 'Language', placeholder: 'en', optional: true },
          ]}
          token={token}
          onTokenReceived={onTokenReceived}
        />

        <RouteCard
          id="login"
          method="POST"
          path="/auth/login"
          title="Login"
          description="Authenticate with username/email and password. A successful response containing a token will be automatically saved to the sidebar."
          fields={[
            { name: 'username_or_email', label: 'Username or Email', placeholder: 'johndoe or john@example.com' },
            { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
          ]}
          token={token}
          onTokenReceived={onTokenReceived}
        />

        <RouteCard
          id="logout"
          method="POST"
          path="/auth/logout"
          title="Logout"
          description="Invalidate the current session. No request body required — just sends the request to the logout endpoint."
          fields={[]}
          token={token}
          onTokenReceived={onTokenReceived}
        />
      </div>
    </section>
  )
}
