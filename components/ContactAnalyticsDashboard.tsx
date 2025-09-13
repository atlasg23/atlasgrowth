'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface TeamStats {
  total_calls: number
  total_templates_sent: number
  total_templates_viewed: number
  answer_rate: number
  conversion_rate: number
  nick_calls: number
  jackson_calls: number
  daily_calls: { date: string; calls: number }[]
  top_performers: { name: string; calls: number; templates: number }[]
}

interface RecentActivity {
  id: string
  type: 'call' | 'template_sent' | 'template_viewed'
  user: string
  business_name: string
  timestamp: string
  outcome?: string
}

export default function ContactAnalyticsDashboard() {
  const [stats, setStats] = useState<TeamStats>({
    total_calls: 0,
    total_templates_sent: 0,
    total_templates_viewed: 0,
    answer_rate: 0,
    conversion_rate: 0,
    nick_calls: 0,
    jackson_calls: 0,
    daily_calls: [],
    top_performers: []
  })
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('7d')

  useEffect(() => {
    loadAnalytics()
  }, [timeframe])

  const loadAnalytics = async () => {
    try {
      // Get date range based on timeframe
      const daysAgo = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysAgo)

      // Load call log statistics with user tracking
      const { data: callStats, error: statsError } = await supabase
        .from('call_logs')
        .select('outcome, template_sent, created_at, notes, user_name')
        .gte('created_at', startDate.toISOString())

      if (statsError) throw statsError

      // Load template view statistics
      const { data: viewStats, error: viewError } = await supabase
        .from('template_views')
        .select('viewed_at, business_slug')
        .gte('viewed_at', startDate.toISOString())

      if (viewError) console.error('Error loading view stats:', viewError)

      const totalCalls = callStats?.length || 0
      const totalTemplatesSent = callStats?.filter(c => c.template_sent).length || 0
      const totalTemplatesViewed = viewStats?.length || 0
      const answeredCalls = callStats?.filter(c => c.outcome === 'Answered' || c.outcome === 'Interested').length || 0

      // Calculate real team member stats from actual data
      const nickCalls = callStats?.filter(c => c.user_name === 'nick').length || 0
      const jacksonCalls = callStats?.filter(c => c.user_name === 'jackson').length || 0
      const nickTemplatesSent = callStats?.filter(c => c.user_name === 'nick' && c.template_sent).length || 0
      const jacksonTemplatesSent = callStats?.filter(c => c.user_name === 'jackson' && c.template_sent).length || 0

      const newStats: TeamStats = {
        total_calls: totalCalls,
        total_templates_sent: totalTemplatesSent,
        total_templates_viewed: totalTemplatesViewed,
        answer_rate: totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0,
        conversion_rate: totalTemplatesSent > 0 ? Math.round((totalTemplatesViewed / totalTemplatesSent) * 100) : 0,
        nick_calls: nickCalls,
        jackson_calls: jacksonCalls,
        daily_calls: [],
        top_performers: [
          { name: 'Nick', calls: nickCalls, templates: nickTemplatesSent },
          { name: 'Jackson', calls: jacksonCalls, templates: jacksonTemplatesSent }
        ]
      }

      setStats(newStats)

      // Load recent call activity
      const { data: businessData, error: businessError } = await supabase
        .from('leads')
        .select('id, business_name')

      if (businessError) console.error('Error loading business data:', businessError)
      const businessMap = new Map(businessData?.map(b => [b.id, b.business_name]) || [])

      // Get recent call activities
      const recentCallActivities: RecentActivity[] = callStats?.slice(0, 5).map((call, index) => ({
        id: `call-${index}`,
        type: 'call' as const,
        user: call.user_name === 'nick' ? 'Nick' : call.user_name === 'jackson' ? 'Jackson' : 'Unknown',
        business_name: businessMap.get(call.notes) || 'Unknown Business',
        timestamp: call.created_at,
        outcome: call.outcome
      })) || []

      // Get recent template views
      const recentViewActivities: RecentActivity[] = viewStats?.slice(0, 5).map((view, index) => ({
        id: `view-${index}`,
        type: 'template_viewed' as const,
        user: 'Prospect',
        business_name: view.business_slug?.replace(/-/g, ' ') || 'Unknown Business',
        timestamp: view.viewed_at
      })) || []

      // Combine and sort activities
      const allActivities = [...recentCallActivities, ...recentViewActivities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)

      setRecentActivity(allActivities)

    } catch (error) {
      console.error('Error loading team analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatCardClass = (type: string) => {
    const baseClass = "bg-white rounded-lg shadow p-6 border-l-4 "
    switch (type) {
      case 'total': return baseClass + "border-blue-500"
      case 'no_answer': return baseClass + "border-yellow-500"
      case 'answered': return baseClass + "border-green-500"
      case 'interested': return baseClass + "border-emerald-500"
      case 'not_interested': return baseClass + "border-red-500"
      case 'sent': return baseClass + "border-purple-500"
      case 'viewed': return baseClass + "border-indigo-500"
      default: return baseClass + "border-gray-500"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Timeframe Selector */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Team Analytics Dashboard</h2>
            <p className="text-gray-600 mt-2">Track team performance and activity metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Timeframe:</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as '7d' | '30d' | '90d')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={getStatCardClass('total')}>
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Calls</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total_calls}</p>
            </div>
            <div className="text-blue-500 text-3xl">📞</div>
          </div>
        </div>

        <div className={getStatCardClass('sent')}>
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Templates Sent</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total_templates_sent}</p>
            </div>
            <div className="text-purple-500 text-3xl">📱</div>
          </div>
        </div>

        <div className={getStatCardClass('viewed')}>
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Websites Viewed</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total_templates_viewed}</p>
            </div>
            <div className="text-indigo-500 text-3xl">👀</div>
          </div>
        </div>

        <div className={getStatCardClass('answered')}>
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Answer Rate</p>
              <p className="text-3xl font-bold text-gray-900">{stats.answer_rate}%</p>
            </div>
            <div className="text-green-500 text-3xl">📈</div>
          </div>
        </div>
      </div>

      {/* Team Performance & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Team Performance</h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {stats.top_performers.map((performer, index) => (
                <div key={performer.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      performer.name === 'Nick' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      <span className={`text-lg font-bold ${
                        performer.name === 'Nick' ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        {performer.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{performer.name}</h4>
                      <p className="text-sm text-gray-600">Team Member</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{performer.calls} calls</div>
                    <div className="text-sm text-gray-600">{performer.templates} templates sent</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Performance Bars */}
            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Nick</span>
                  <span>{stats.nick_calls} calls</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: stats.total_calls > 0 ? `${(stats.nick_calls / stats.total_calls) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Jackson</span>
                  <span>{stats.jackson_calls} calls</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: stats.total_calls > 0 ? `${(stats.jackson_calls / stats.total_calls) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <div className="font-medium">No recent activity</div>
                <div className="text-sm">Activity will appear as team members make calls</div>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      activity.type === 'call' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'template_sent' ? 'bg-purple-100 text-purple-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {activity.type === 'call' ? '📞' :
                       activity.type === 'template_sent' ? '📱' : '👀'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900">
                        <span className="font-medium">{activity.user}</span>
                        {' '}
                        {activity.type === 'call' ? 'called' :
                         activity.type === 'template_sent' ? 'sent template to' :
                         'got website view from'}
                        {' '}
                        <span className="font-medium">{activity.business_name}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                        {activity.outcome && (
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                            activity.outcome === 'Answered' ? 'bg-green-100 text-green-700' :
                            activity.outcome === 'No Answer' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {activity.outcome}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conversion Metrics */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.answer_rate}%</div>
            <div className="text-sm text-gray-600">Call Answer Rate</div>
            <div className="text-xs text-gray-500 mt-1">
              How often calls are answered
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.conversion_rate}%</div>
            <div className="text-sm text-gray-600">Template View Rate</div>
            <div className="text-xs text-gray-500 mt-1">
              How often sent templates are viewed
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {stats.total_calls > 0 ? Math.round((stats.total_templates_sent / stats.total_calls) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Template Send Rate</div>
            <div className="text-xs text-gray-500 mt-1">
              How often calls result in template sends
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}