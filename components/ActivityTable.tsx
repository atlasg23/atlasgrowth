'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface ActivityTableProps {
  filter: 'all' | 'websites_sent' | 'websites_viewed' | 'interested' | 'analytics'
}

interface ActivityData {
  id: string
  type: 'call' | 'template_sent' | 'template_viewed'
  business_name: string // Display name for the activity
  user: string
  outcome?: string
  timestamp: string
  phone?: string
  email?: string
  template_url?: string
}

interface Analytics {
  total_calls: number
  nick_calls: number
  jackson_calls: number
  templates_sent: number
  templates_viewed: number
  answer_rate: number
  conversion_rate: number
}

export default function ActivityTable({ filter }: ActivityTableProps) {
  const [activities, setActivities] = useState<ActivityData[]>([])
  const [analytics, setAnalytics] = useState<Analytics>({
    total_calls: 0,
    nick_calls: 0,
    jackson_calls: 0,
    templates_sent: 0,
    templates_viewed: 0,
    answer_rate: 0,
    conversion_rate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [filter])

  const loadData = async () => {
    setLoading(true)
    try {
      if (filter === 'analytics') {
        await loadAnalytics()
      } else {
        await loadActivities()
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadActivities = async () => {
    // Get call logs
    const { data: callData, error: callError } = await supabase
      .from('call_logs')
      .select(`
        id,
        call_date,
        outcome,
        user_name,
        template_sent,
        template_url,
        business_id,
        owner_name,
        owner_phone,
        owner_email
      `)
      .order('call_date', { ascending: false })
      .limit(100)

    if (callError) throw callError

    // Get business names
    const businessIds = Array.from(new Set(callData?.map(c => c.business_id) || [])).filter(Boolean)
    let businessData: Array<{id: any, name: any}> = []
    let businessError = null
    
    if (businessIds.length > 0) {
      const result = await supabase
        .from('leads')
        .select('id, name')
        .in('id', businessIds)
      
      businessData = result.data || []
      businessError = result.error
    }

    if (businessError) console.error('Error loading business data:', businessError)
    
    const businessMap = new Map(businessData?.map(b => [b.id, b.name]) || [])

    // Skip template views for now - table doesn't exist
    const viewData: any[] = []
    const viewError = null

    // Combine all activities
    const callActivities: ActivityData[] = callData?.map(call => ({
      id: `call-${call.id}`,
      type: 'call' as const,
      business_name: businessMap.get(call.business_id) || call.owner_name || 'Unknown Business',
      user: call.user_name === 'nick' ? 'Nick' : call.user_name === 'jackson' ? 'Jackson' : 'Unknown',
      outcome: call.outcome,
      timestamp: call.call_date,
      phone: call.owner_phone,
      email: call.owner_email,
      template_url: call.template_sent ? call.template_url : undefined
    })) || []

    const templateSentActivities: ActivityData[] = callData
      ?.filter(call => call.template_sent)
      ?.map(call => ({
        id: `template-sent-${call.id}`,
        type: 'template_sent' as const,
        business_name: businessMap.get(call.business_id) || call.owner_name || 'Unknown Business',
        user: call.user_name === 'nick' ? 'Nick' : call.user_name === 'jackson' ? 'Jackson' : 'Unknown',
        timestamp: call.call_date,
        template_url: call.template_url
      })) || []

    const viewActivities: ActivityData[] = viewData.map((view: any) => ({
      id: `view-${view.id}`,
      type: 'template_viewed' as const,
      business_name: view.business_slug?.replace(/-/g, ' ') || 'Unknown Business',
      user: 'Prospect',
      timestamp: view.viewed_at
    }))

    // Combine and filter
    let allActivities = [...callActivities, ...templateSentActivities, ...viewActivities]

    // Apply filters
    switch (filter) {
      case 'websites_sent':
        allActivities = allActivities.filter(a => a.type === 'template_sent')
        break
      case 'websites_viewed':
        allActivities = allActivities.filter(a => a.type === 'template_viewed')
        break
      case 'interested':
        allActivities = allActivities.filter(a => 
          a.type === 'call' && (a.outcome === 'Interested' || a.outcome === 'Answered')
        )
        break
    }

    // Sort by timestamp
    allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    setActivities(allActivities.slice(0, 100))
  }

  const loadAnalytics = async () => {
    // Get call statistics
    const { data: callStats, error: callError } = await supabase
      .from('call_logs')
      .select('outcome, template_sent, user_name')

    if (callError) throw callError

    // Skip template views for now - table doesn't exist
    const viewStats: any[] = []
    const viewError = null

    const totalCalls = callStats?.length || 0
    const nickCalls = callStats?.filter(c => c.user_name === 'nick').length || 0
    const jacksonCalls = callStats?.filter(c => c.user_name === 'jackson').length || 0
    const templatesSent = callStats?.filter(c => c.template_sent).length || 0
    const templatesViewed = viewStats.length
    const answeredCalls = callStats?.filter(c => c.outcome === 'Answered' || c.outcome === 'Interested').length || 0

    setAnalytics({
      total_calls: totalCalls,
      nick_calls: nickCalls,
      jackson_calls: jacksonCalls,
      templates_sent: templatesSent,
      templates_viewed: templatesViewed,
      answer_rate: totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0,
      conversion_rate: templatesSent > 0 ? Math.round((templatesViewed / templatesSent) * 100) : 0
    })
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getActivityIcon = (type: string, outcome?: string) => {
    switch (type) {
      case 'call':
        if (outcome === 'Answered' || outcome === 'Interested') return '✅'
        if (outcome === 'No Answer') return '❌'
        return '📞'
      case 'template_sent':
        return '📱'
      case 'template_viewed':
        return '👀'
      default:
        return '📝'
    }
  }

  const getOutcomeColor = (outcome?: string) => {
    switch (outcome) {
      case 'Answered':
      case 'Interested':
        return 'text-green-600'
      case 'No Answer':
        return 'text-yellow-600'
      case 'Not Interested':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (filter === 'analytics') {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Analytics Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{analytics.total_calls}</div>
            <div className="text-sm text-gray-600">Total Calls</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{analytics.templates_sent}</div>
            <div className="text-sm text-gray-600">Websites Sent</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{analytics.templates_viewed}</div>
            <div className="text-sm text-gray-600">Websites Viewed</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Performance by Team Member</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Nick</span>
                <span className="text-lg font-bold">{analytics.nick_calls} calls</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Jackson</span>
                <span className="text-lg font-bold">{analytics.jackson_calls} calls</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Conversion Rates</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>Answer Rate</span>
                <span className="text-lg font-bold text-green-600">{analytics.answer_rate}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>Website View Rate</span>
                <span className="text-lg font-bold text-purple-600">{analytics.conversion_rate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Activity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Outcome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activities.map((activity) => (
              <tr key={activity.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">
                      {getActivityIcon(activity.type, activity.outcome)}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {activity.type === 'call' ? 'Phone Call' :
                         activity.type === 'template_sent' ? 'Website Sent' :
                         'Website Viewed'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 font-medium">
                    {activity.business_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{activity.user}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {activity.outcome ? (
                    <span className={`text-sm font-medium ${getOutcomeColor(activity.outcome)}`}>
                      {activity.outcome}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatTimestamp(activity.timestamp)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>
                    {activity.phone && <div>{activity.phone}</div>}
                    {activity.email && <div>{activity.email}</div>}
                    {activity.template_url && (
                      <a 
                        href={activity.template_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        View Site
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {activities.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {filter === 'all' ? 'No activity found' :
               filter === 'websites_sent' ? 'No websites sent yet' :
               filter === 'websites_viewed' ? 'No websites viewed yet' :
               'No interested prospects yet'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}