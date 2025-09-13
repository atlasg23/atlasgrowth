'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check if already logged in
    const adminAuth = document.cookie
      .split('; ')
      .find(row => row.startsWith('admin_authenticated='))
      ?.split('=')[1]
    
    if (adminAuth === 'true') {
      setIsLoggedIn(true)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      })

      const result = await response.json()

      if (result.success) {
        setIsLoggedIn(true)
        setMessage('✅ Logged in successfully! GoHighLevel sync is now enabled.')
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        setMessage('❌ Invalid credentials')
      }
    } catch (error) {
      setMessage('❌ Login error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'DELETE'
      })

      if (response.ok) {
        setIsLoggedIn(false)
        setMessage('Logged out successfully')
        // Clear form
        setUsername('')
        setPassword('')
      }
    } catch (error) {
      setMessage('Logout error occurred')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-gray-600 mt-2">
            Login to enable GoHighLevel integration
          </p>
        </div>

        {!isLoggedIn ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-6">
            <div className="text-green-600 text-lg font-semibold">
              ✅ Admin Authenticated
            </div>
            <p className="text-gray-600">
              GoHighLevel integration is now active. When you click "Send Template" in the CRM, it will:
            </p>
            <ul className="text-left text-sm text-gray-700 space-y-2 bg-gray-50 p-4 rounded-lg">
              <li>📱 Open your phone's SMS app with pre-filled message</li>
              <li>🔄 Automatically sync contact to GoHighLevel</li>
              <li>📊 Update your CRM pipeline</li>
            </ul>
            
            <div className="space-y-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 font-medium"
              >
                Go to CRM Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        )}

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.includes('✅') 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

      </div>
    </div>
  )
}