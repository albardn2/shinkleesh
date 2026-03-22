import RouteCard from '../components/RouteCard'

export default function AccountSection({ token, onTokenReceived }) {
  return (
    <section>
      {/* Section header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 rounded-full bg-blue-500" />
          <h2 className="text-2xl font-bold text-slate-800">My Account</h2>
        </div>
        <p className="text-slate-500 text-sm pl-4">
          JWT authentication required. These endpoints allow you to view and update your own account details. Set a token in the sidebar first.
        </p>
      </div>

      <div className="space-y-4">
        <RouteCard
          id="me-get"
          method="GET"
          path="/auth/me"
          title="Get My Profile"
          description="Returns the currently authenticated user's profile information, including username, email, phone number, language, and permission scope."
          fields={[]}
          requiresAuth
          token={token}
          onTokenReceived={onTokenReceived}
        />

        <RouteCard
          id="me-put"
          method="PUT"
          path="/auth/me"
          title="Update My Profile"
          description="Update your own account details. Only include fields you want to change — empty fields are stripped from the request. Password change is also supported here."
          fields={[
            { name: 'username', label: 'Username', placeholder: 'new username', optional: true },
            { name: 'email', label: 'Email', type: 'email', placeholder: 'new@example.com', optional: true },
            { name: 'phone_number', label: 'Phone Number', placeholder: '+1 555 000 0000', optional: true },
            { name: 'language', label: 'Language', placeholder: 'en', optional: true },
            { name: 'password', label: 'New Password', type: 'password', placeholder: '••••••••', optional: true },
            { name: 'notification_token', label: 'Notification Token', placeholder: 'FCM / APNS token', optional: true },
          ]}
          requiresAuth
          token={token}
          onTokenReceived={onTokenReceived}
        />
      </div>
    </section>
  )
}
