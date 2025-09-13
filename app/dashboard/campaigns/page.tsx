'use client'
import { useState, useEffect } from 'react'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000)
  }, [])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-xl">Loading campaigns...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">SMS Campaigns</h2>
        
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📢</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Campaign Management</h3>
          <p className="text-gray-600 mb-6">
            Create and manage automated SMS campaigns
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left max-w-md mx-auto">
            <h4 className="font-medium text-green-900 mb-2">Coming Soon:</h4>
            <ul className="text-green-800 text-sm space-y-1">
              <li>• Bulk SMS campaigns</li>
              <li>• Automated follow-up sequences</li>
              <li>• Campaign analytics and metrics</li>
              <li>• A/B test message templates</li>
              <li>• Schedule campaigns</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}