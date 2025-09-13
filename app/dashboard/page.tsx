'use client'
import { getAllLeadsClient } from '@/lib/loadLeadsClient'
import { Lead } from '@/types/lead'
import { adaptLeadToBusiness } from '@/lib/leadToBusinessAdapter'
import { useState, useEffect } from 'react'
import ActivityTable from '@/components/ActivityTable'
import TemplateAnalyticsDashboard from '@/components/TemplateAnalyticsDashboard'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | 'websites_sent' | 'websites_viewed' | 'interested' | 'analytics'>('all')
  
  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      const adminAuth = document.cookie
        .split('; ')
        .find(row => row.startsWith('admin_authenticated='))
        ?.split('=')[1]
      
      if (adminAuth === 'true') {
        setIsAuthenticated(true)
      } else {
        // Redirect to admin login
        router.push('/admin')
        return
      }
      setAuthChecked(true)
    }

    checkAuth()
  }, [router])

  // Show loading screen while checking authentication
  if (!authChecked || (authChecked && !isAuthenticated)) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-4">
              Checking Authentication...
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">
              Verifying admin access...
            </div>
          </div>
        </div>
      </div>
    )
  }

  const filterButtons = [
    { key: 'all', label: 'Recent Activity' },
    { key: 'websites_sent', label: 'Websites Sent' },
    { key: 'websites_viewed', label: 'Websites Viewed' },
    { key: 'interested', label: 'Interested' },
    { key: 'analytics', label: 'Analytics' }
  ]

  return (
    <div className="flex-1">
      <div className="bg-white shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-gray-600 mt-2">Activity tracking and team analytics</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm">
                <span className="text-green-600 font-medium">✓ Admin Authenticated</span>
              </div>
              <button
                onClick={async () => {
                  await fetch('/api/admin/login', { method: 'DELETE' })
                  router.push('/admin')
                }}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                🚪 Logout
              </button>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="mt-6 flex flex-wrap gap-2">
            {filterButtons.map(button => (
              <button
                key={button.key}
                onClick={() => setActiveFilter(button.key as any)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeFilter === button.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {button.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Table Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeFilter === 'analytics' ? (
          <TemplateAnalyticsDashboard />
        ) : (
          <ActivityTable filter={activeFilter} />
        )}
      </div>
    </div>
  )
}