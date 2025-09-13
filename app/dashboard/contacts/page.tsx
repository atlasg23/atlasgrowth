'use client'
import { getAllLeadsClient } from '@/lib/loadLeadsClient'
import { Lead } from '@/types/lead'
import { adaptLeadToBusiness } from '@/lib/leadToBusinessAdapter'
import { useState, useEffect } from 'react'
import BusinessDetailTabs from '@/components/BusinessDetailTabs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface BusinessTypeCounts {
  withSite: Lead[]
  withoutSite: Lead[]
}

interface Filters {
  businessType: string
  hasPhotos: 'all' | 'yes' | 'no'
  verified: 'all' | 'yes' | 'no'
  hasValidEmail: 'all' | 'yes' | 'no'
  hasSite: 'all' | 'yes' | 'no'
  hasFacebook: 'all' | 'yes' | 'no'
  minRating: string
  minReviews: string
  state: string
  city: string
  search: string
}

export default function Contacts() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [filters, setFilters] = useState<Filters>({
    businessType: 'all',
    hasPhotos: 'all',
    verified: 'all',
    hasValidEmail: 'all',
    hasSite: 'all',
    hasFacebook: 'all',
    minRating: '',
    minReviews: '',
    state: '',
    city: '',
    search: ''
  })
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [availableBusinessTypes, setAvailableBusinessTypes] = useState<string[]>([])
  
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

  // Available states - only Louisiana, Arkansas, Alabama
  const availableStates = [
    { value: '', label: 'All States' },
    { value: 'louisiana', label: 'Louisiana' },
    { value: 'arkansas', label: 'Arkansas' }, 
    { value: 'alabama', label: 'Alabama' }
  ]

  // Debounced effect for filters (prevents search spam on every keystroke)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadLeads()
    }, 300) // 300ms delay

    return () => clearTimeout(timeoutId)
  }, [filters, pagination.page])

  // Reset to page 1 when filters change (but not page itself)
  useEffect(() => {
    if (pagination && pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }))
    }
  }, [filters.businessType, filters.hasPhotos, filters.verified, filters.hasValidEmail, filters.hasSite, filters.hasFacebook, filters.minRating, filters.minReviews, filters.state, filters.city, filters.search])

  // Load business types for filter dropdown
  useEffect(() => {
    loadBusinessTypes()
  }, [])

  const loadBusinessTypes = async () => {
    try {
      const response = await fetch('/api/leads/business-types')
      if (response.ok) {
        const { businessTypes } = await response.json()
        setAvailableBusinessTypes(businessTypes)
      }
    } catch (error) {
      console.error('Error loading business types:', error)
    }
  }

  // Load leads using the paginated API
  const loadLeads = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.businessType !== 'all' && { businessType: filters.businessType }),
        ...(filters.hasPhotos !== 'all' && { hasPhotos: filters.hasPhotos }),
        ...(filters.verified !== 'all' && { verified: filters.verified }),
        ...(filters.hasValidEmail !== 'all' && { hasValidEmail: filters.hasValidEmail }),
        ...(filters.hasSite !== 'all' && { hasSite: filters.hasSite }),
        ...(filters.hasFacebook !== 'all' && { hasFacebook: filters.hasFacebook }),
        ...(filters.minRating && { minRating: filters.minRating }),
        ...(filters.minReviews && { minReviews: filters.minReviews }),
        ...(filters.state && { state: filters.state }),
        ...(filters.search && { search: filters.search })
      })

      const response = await fetch(`/api/leads/paginated?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch leads')
      }

      const { leads: fetchedLeads, pagination: paginationData } = await response.json()
      
      setLeads(fetchedLeads)
      setPagination(paginationData)
    } catch (error) {
      console.error('Error loading leads:', error)
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  // Show loading screen while checking authentication or loading data
  if (!authChecked || (authChecked && !isAuthenticated) || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-4">
              {!authChecked ? 'Checking Authentication...' : 'Loading Contacts'}
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">
              {!authChecked ? 'Verifying admin access...' : 'Fetching your business contacts...'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Contacts</h1>
                  <p className="text-sm text-gray-500">Manage your business database</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">Admin Access</span>
              </div>
              
              <button
                onClick={async () => {
                  await fetch('/api/admin/login', { method: 'DELETE' })
                  router.push('/admin')
                }}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Search & Filter Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex flex-col space-y-4">
            {/* Top Row - Search and Key Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  placeholder="Search businesses..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              
              <select
                value={filters.businessType}
                onChange={(e) => setFilters({...filters, businessType: e.target.value})}
                className="block px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Industries</option>
                {availableBusinessTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              
              <select
                value={filters.state}
                onChange={(e) => setFilters({...filters, state: e.target.value})}
                className="block px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {availableStates.map(state => (
                  <option key={state.value} value={state.value}>{state.label}</option>
                ))}
              </select>
              
              <div className="flex items-center text-sm text-gray-500 font-medium bg-gray-50 px-3 py-2 rounded-md">
                {pagination?.total?.toLocaleString() || 0} contacts
              </div>
            </div>
            
            {/* Bottom Row - Advanced Filters */}
            <div className="flex items-center space-x-3 text-sm">
              <span className="text-gray-500 font-medium">Filters:</span>
              <select value={filters.verified} onChange={(e) => setFilters({...filters, verified: e.target.value as 'all' | 'yes' | 'no'})} className="text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500">
                <option value="all">All Status</option><option value="yes">Verified</option><option value="no">Unverified</option>
              </select>
              <select value={filters.hasValidEmail} onChange={(e) => setFilters({...filters, hasValidEmail: e.target.value as 'all' | 'yes' | 'no'})} className="text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500">
                <option value="all">All Emails</option><option value="yes">Valid Email</option><option value="no">No Email</option>
              </select>
              <select value={filters.hasSite} onChange={(e) => setFilters({...filters, hasSite: e.target.value as 'all' | 'yes' | 'no'})} className="text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500">
                <option value="all">All Websites</option><option value="yes">Has Website</option><option value="no">No Website</option>
              </select>
              <select value={filters.hasPhotos} onChange={(e) => setFilters({...filters, hasPhotos: e.target.value as 'all' | 'yes' | 'no'})} className="text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500">
                <option value="all">All Photos</option><option value="yes">Has Photos</option><option value="no">No Photos</option>
              </select>
              <input type="number" value={filters.minRating} onChange={(e) => setFilters({...filters, minRating: e.target.value})} placeholder="Min rating" className="w-20 text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" min="1" max="5" step="0.1" />
            </div>
          </div>
        </div>
      </div>

      {/* Professional Data Table */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-lg border border-gray-200">
          {leads.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search filters to find contacts.</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              {/* Table Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-3">Business</div>
                  <div className="col-span-2">Contact</div>
                  <div className="col-span-2">Location</div>
                  <div className="col-span-2">Rating</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>
              
              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {leads.map((lead, index) => {
                  const business = adaptLeadToBusiness(lead)
                  return (
                    <div key={lead.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Business Info */}
                        <div className="col-span-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-blue-600">
                                {business.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {business.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {business.niche || 'Business'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Contact Info */}
                        <div className="col-span-2">
                          <div className="flex items-center text-sm text-gray-900">
                            <svg className="w-4 h-4 text-gray-400 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L6.25 10.5a11.042 11.042 0 004.25 4.25l1.093-3.974a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="truncate">{business.phone || 'No phone'}</span>
                          </div>
                        </div>
                        
                        {/* Location */}
                        <div className="col-span-2">
                          <div className="flex items-center text-sm text-gray-900">
                            <svg className="w-4 h-4 text-gray-400 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">{business.city}, {business.state}</span>
                          </div>
                        </div>
                        
                        {/* Rating */}
                        <div className="col-span-2">
                          <div className="flex items-center space-x-2">
                            {business.rating ? (
                              <div className="flex items-center">
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <span className="text-sm font-medium text-gray-900">{business.rating}</span>
                                </div>
                                <span className="text-xs text-gray-500">({business.reviews || 0} reviews)</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">No rating</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Status & Badges */}
                        <div className="col-span-2">
                          <div className="flex items-center space-x-1">
                            {business.verified && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Verified
                              </span>
                            )}
                            {business.photos_count && Number(business.photos_count) > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {business.photos_count} Photos
                              </span>
                            )}
                            {business.site && (
                              <a 
                                href={business.site.startsWith('http') ? business.site : `https://${business.site}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors cursor-pointer"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Website
                              </a>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="col-span-1">
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Professional Pagination */}
          {pagination?.totalPages > 1 && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-medium text-gray-900">{((pagination?.page - 1) * pagination?.limit) + 1}</span> to{' '}
                  <span className="font-medium text-gray-900">{Math.min(pagination?.page * pagination?.limit, pagination?.total)}</span> of{' '}
                  <span className="font-medium text-gray-900">{pagination?.total?.toLocaleString()}</span> results
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={!pagination?.hasPrev}
                    className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>
                  
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Page {pagination?.page || 1} of {pagination?.totalPages || 1}
                  </span>
                  
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={!pagination?.hasNext}
                    className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-md"
                  >
                    Next
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      {/* Lead Detail Modal - Available in both views */}
      {selectedLead && (
        <BusinessDetailTabs 
          business={adaptLeadToBusiness(selectedLead)} 
          onClose={() => setSelectedLead(null)}
        />
      )}
    </div>
    </div>
  )
}