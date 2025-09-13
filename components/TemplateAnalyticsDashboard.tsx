'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface TemplateView {
  id: number
  business_slug: string
  template_type: string
  visitor_ip: string
  is_unique: boolean
  duration_seconds: number | null
  interactions: number
  viewed_at: string
  left_at: string | null
}

interface Analytics {
  totalViews: number
  uniqueVisitors: number
  avgDuration: number
  engagedViews: number
  recentViews: TemplateView[]
}

export default function TemplateAnalyticsDashboard({ businessSlug }: { businessSlug?: string }) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadAnalytics, 30000)
    return () => clearInterval(interval)
  }, [businessSlug])

  const loadAnalytics = async () => {
    try {
      let query = supabase.from('template_views').select('*')
      
      if (businessSlug) {
        query = query.eq('business_slug', businessSlug)
      }
      
      const { data: views, error } = await query.order('viewed_at', { ascending: false })
      
      if (error) throw error
      
      if (views) {
        const uniqueVisitors = new Set(views.filter(v => v.is_unique).map(v => v.visitor_ip)).size
        const durations = views.filter(v => v.duration_seconds).map(v => v.duration_seconds!)
        const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0
        const engagedViews = views.filter(v => v.duration_seconds && v.duration_seconds > 30).length
        
        setAnalytics({
          totalViews: views.length,
          uniqueVisitors,
          avgDuration: Math.round(avgDuration),
          engagedViews,
          recentViews: views.slice(0, 10)
        })
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-4">Loading analytics...</div>
  if (!analytics) return <div className="p-4">No data available</div>

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-900">{analytics.totalViews}</div>
          <div className="text-sm text-gray-600">Total Views</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{analytics.uniqueVisitors}</div>
          <div className="text-sm text-gray-600">Unique Visitors</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{analytics.avgDuration}s</div>
          <div className="text-sm text-gray-600">Avg Duration</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-purple-600">{analytics.engagedViews}</div>
          <div className="text-sm text-gray-600">Engaged (&gt;30s)</div>
        </div>
      </div>

      {/* Recent Views Table */}
      <div className="bg-white rounded-lg border">
        <div className="px-4 py-3 border-b">
          <h3 className="text-lg font-semibold">Recent Template Views</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Business</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Template</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Visitor Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Duration</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Interactions</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Viewed At</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {analytics.recentViews.map((view) => (
                <tr key={view.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">{view.business_slug}</td>
                  <td className="px-4 py-2 text-sm">{view.template_type}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      view.is_unique ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {view.is_unique ? 'New' : 'Returning'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {view.duration_seconds ? `${view.duration_seconds}s` : '-'}
                  </td>
                  <td className="px-4 py-2 text-sm">{view.interactions || 0}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {new Date(view.viewed_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}