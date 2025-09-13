'use client'
import React, { useState, useEffect } from 'react'
import { Business } from '@/types/business'
import { supabase } from '@/lib/supabase'
import ImageUploader from './ImageUploader'

// Helper function to get template options based on business type
const getTemplateOptions = (businessType: string) => {
  const type = businessType?.toLowerCase() || ''
  
  if (type.includes('plumb')) {
    return [
      { value: 'plumbing-pro', label: 'Plumbing Template (Professional)' }
    ]
  } else if (type.includes('hvac') || type.includes('heating') || type.includes('cooling') || type.includes('air')) {
    return [{ value: 'hvac', label: 'HVAC Template' }]
  } else if (type.includes('fire') || type.includes('protection')) {
    return [{ value: 'fire-protection', label: 'Fire Protection Template' }]
  } else if (type.includes('pest') || type.includes('control')) {
    return [{ value: 'pest-control', label: 'Pest Control Template' }]
  } else if (type.includes('pressure') || type.includes('washing') || type.includes('cleaning')) {
    return [{ value: 'pressure-washing', label: 'Pressure Washing Template' }]
  } else if (type.includes('roof')) {
    return [{ value: 'roofing', label: 'Roofing Template' }]
  } else if (type.includes('tree') || type.includes('service')) {
    return [{ value: 'tree-service', label: 'Tree Service Template' }]
  } else {
    // Default fallback - show HVAC template
    return [{ value: 'hvac', label: 'HVAC Template' }]
  }
}

interface BusinessDetailTabsProps {
  business: Business
  onClose: () => void
}

type TabType = 'overview' | 'reviews' | 'website' | 'notes' | 'activities'

export default function BusinessDetailTabs({ business, onClose }: BusinessDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const templateOptions = getTemplateOptions(business.business_type || business.niche)
  const [selectedTemplate, setSelectedTemplate] = useState(templateOptions[0].value)

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'website', label: 'Website' },
    { id: 'notes', label: 'Notes' },
    { id: 'activities', label: 'Activities' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Professional Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-semibold text-blue-600">
                  {business.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{business.name}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {business.niche}
                  </span>
                  <span className="text-sm text-gray-500">{business.city}, {business.state}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Professional Tab Navigation */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="px-6">
            <nav className="flex space-x-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-white rounded-t-md'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && <OverviewTab business={business} />}
          {activeTab === 'reviews' && <ReviewsTab business={business} />}
          {activeTab === 'website' && <WebsiteTab business={business} selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate} />}
          {activeTab === 'notes' && <NotesTab business={business} />}
          {activeTab === 'activities' && <ActivitiesTab business={business} />}
        </div>
      </div>
    </div>
  )
}

function OverviewTab({ business }: { business: Business }) {
  const [sendingTemplate, setSendingTemplate] = useState(false)
  const [templateSent, setTemplateSent] = useState(false)
  const templateOptions = getTemplateOptions(business.business_type || business.niche)
  // Use the actual database slug - don't generate from name
  const businessSlug = business.slug
  
  // Safety check - don't show template link if no slug exists
  if (!businessSlug) {
    console.warn('No slug found for business:', business.name)
  }
  
  const sendTemplateViaSMS = async () => {
    if (!business.phone) {
      alert('No phone number available for this business')
      return
    }
    
    setSendingTemplate(true)
    
    try {
      // Use the template options already defined in component scope
      const templateType = templateOptions[0].value
      
      // Build template URL
      const baseUrl = window.location.origin
      const templateUrl = `${baseUrl}/${templateType}/${businessSlug}`
      
      // Create SMS body
      const smsBody = `Hi ${business.name}! Here's the custom website template I put together for your business: ${templateUrl}`
      
      // Send to GoHighLevel when template is sent
      fetch('/api/template-sent-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: business.name,
          business_phone: business.phone,
          business_email: business.email1 || '',
          business_slug: businessSlug,
          template_type: templateType,
          template_url: templateUrl,
          event: 'template_sent',
          sent_at: new Date().toISOString()
        })
      }).catch(err => console.error('GHL webhook failed:', err))
      
      // Open native SMS app with pre-filled message
      const smsLink = `sms:${business.phone}?body=${encodeURIComponent(smsBody)}`
      window.open(smsLink, '_blank')
      
      setTemplateSent(true)
      setTimeout(() => setTemplateSent(false), 5000) // Reset after 5 seconds
      
    } catch (error) {
      console.error('Error sending template:', error)
      alert('Failed to open SMS app')
    } finally {
      setSendingTemplate(false)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Contact Info */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <div className="flex items-center gap-2">
                <a href={`tel:${business.phone}`} className="text-blue-600 hover:underline">
                  {business.phone}
                </a>
                {business.phone_carrier_type && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {business.phone_carrier_type}
                  </span>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={sendTemplateViaSMS}
                    disabled={sendingTemplate || templateSent}
                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      templateSent 
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : sendingTemplate
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600'
                    }`}
                  >
                    {templateSent ? (
                      <>
                        <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Sent
                      </>
                    ) : sendingTemplate ? (
                      'Sending...'
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Send Template
                      </>
                    )}
                  </button>
                  <a
                    href={`/${templateOptions[0].value}/${businessSlug}`}
                    target="_blank"
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors border border-gray-300"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Website
                  </a>
                </div>
              </div>
            </div>
            
            {business.email1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <a href={`mailto:${business.email1}`} className="text-blue-600 hover:underline">
                  {business.email1}
                </a>
                {business.email1_status && (
                  <span className={`ml-2 text-xs px-2 py-1 rounded ${
                    business.email1_status === 'INVALID' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {business.email1_status}
                  </span>
                )}
              </div>
            )}

            {business.site && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <a href={business.site} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {business.site}
                </a>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <p className="text-gray-900">{business.addr1}</p>
              <p className="text-gray-600">{business.city}, {business.state} {business.postal}</p>
            </div>

            {business.rating && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Rating</label>
                <p className="text-gray-900">{business.rating} ({business.reviews || 0} reviews)</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Additional Details */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            {business.verified && (
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Verified Business</span>
              </div>
            )}
            {business.photos_count && (
              <div>Photos: {business.photos_count}</div>
            )}
            {business.place_id && (
              <div className="text-sm text-gray-500">Google Place ID: {business.place_id}</div>
            )}
          </div>
          
          <div className="space-y-2">
            {/* Social Media */}
            {(business.facebook || business.instagram || business.linkedin) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Social Media</label>
                <div className="space-y-1">
                  {business.facebook && (
                    <a href={business.facebook} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline text-sm">
                      Facebook
                    </a>
                  )}
                  {business.instagram && (
                    <a href={business.instagram} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline text-sm">
                      Instagram
                    </a>
                  )}
                  {business.linkedin && (
                    <a href={business.linkedin} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline text-sm">
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function ReviewsTab({ business }: { business: Business }) {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchMessage, setFetchMessage] = useState('')

  // Load existing reviews on component mount
  useEffect(() => {
    if (business.place_id) {
      loadExistingReviews()
    }
  }, [business.place_id])

  const loadExistingReviews = async () => {
    if (!business.place_id) return
    
    try {
      const { data, error } = await supabase
        .from('google_reviews')
        .select('*')
        .eq('place_id', business.place_id)
        .order('review_date', { ascending: false })

      if (!error && data) {
        setReviews(data)
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    }
  }

  const fetchReviews = async () => {
    if (!business.place_id) {
      setFetchMessage('No place_id available for this business')
      return
    }

    setLoading(true)
    setFetchMessage('')

    try {
      const response = await fetch('/api/reviews/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ placeId: business.place_id })
      })

      const result = await response.json()

      if (response.ok) {
        setReviews(result.reviews || [])
        setFetchMessage(result.message)
      } else {
        setFetchMessage(result.error || 'Failed to fetch reviews')
      }
    } catch (error) {
      setFetchMessage('Error fetching reviews')
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const renderStars = (stars: number) => {
    return '★'.repeat(stars) + '☆'.repeat(5 - stars)
  }

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Analytics</h3>
        {business.rating ? (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{business.rating}</div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{business.reviews || 0}</div>
                <div className="text-sm text-gray-600">Total Reviews</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {business.reviews_link ? 'View' : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Reviews Link</div>
              </div>
            </div>
            
            <div className="mt-4 flex gap-3 justify-center">
              {business.reviews_link && (
                <a 
                  href={business.reviews_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  View All Reviews
                </a>
              )}
              
              {business.place_id && (
                <button
                  onClick={fetchReviews}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Fetching...
                    </>
                  ) : (
                    'Fetch Reviews'
                  )}
                </button>
              )}
            </div>

            {fetchMessage && (
              <div className={`mt-3 text-center text-sm ${
                fetchMessage.includes('Error') || fetchMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'
              }`}>
                {fetchMessage}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No review data available
          </div>
        )}
      </section>

      {/* Google Reviews Section */}
      {reviews.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Google Reviews ({reviews.length})
          </h3>
          <div className="space-y-4">
            {reviews.map((review, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {review.reviewer_name || 'Anonymous Reviewer'}
                      </span>
                      <span className="text-yellow-500 text-sm">
                        {renderStars(review.stars)}
                      </span>
                      <span className="text-gray-500 text-sm">
                        ({review.stars}/5)
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(review.review_date)}
                      {review.is_local_guide && (
                        <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          Local Guide
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-800 leading-relaxed mb-3">
                  {review.review_text}
                </p>
                
                {review.response_from_owner_text && (
                  <div className="bg-gray-50 border-l-4 border-blue-500 p-3 mt-3">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      Response from owner
                    </div>
                    <p className="text-sm text-gray-700">{review.response_from_owner_text}</p>
                    {review.response_from_owner_date && (
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(review.response_from_owner_date)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function WebsiteTab({ business, selectedTemplate, setSelectedTemplate }: { business: Business, selectedTemplate: string, setSelectedTemplate: (template: string) => void }) {
  const getStockImages = () => {
    const niche = business.niche?.toLowerCase() || ''
    if (niche.includes('plumb')) {
      return {
        hero: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        about: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
      }
    } else {
      return {
        hero: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        about: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
      }
    }
  }

  const stockImages = getStockImages()
  const [heroImageUrl, setHeroImageUrl] = useState(business.hero_image || stockImages.hero)
  const [aboutImageUrl, setAboutImageUrl] = useState(business.about_image || stockImages.about)
  const [logoUrl, setLogoUrl] = useState(business.logo || '')

  const handleImageSuccess = (imageType: 'logo' | 'hero' | 'about', url: string) => {
    // Update local state to reflect changes immediately
    if (imageType === 'hero') {
      setHeroImageUrl(url)
    } else if (imageType === 'about') {
      setAboutImageUrl(url)
    } else if (imageType === 'logo') {
      setLogoUrl(url)
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Website Management</h3>
        
        <div className="bg-gray-50 p-4 rounded-lg space-y-6">
          {/* Current Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Website</label>
            {business.site ? (
              <a href={business.site} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {business.site}
              </a>
            ) : (
              <span className="text-gray-500">No website</span>
            )}
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Template Type</label>
            <select 
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {getTemplateOptions(business.business_type || business.niche).map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Image Management */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-4">Image Management</h4>
            <div className="space-y-6">
              {/* Dynamic Import for ImageUploader */}
              {typeof window !== 'undefined' && (
                <>
                  <ImageUploader 
                    businessSlug={business.slug}
                    imageType="hero"
                    currentUrl={heroImageUrl}
                    onUploadSuccess={(url) => handleImageSuccess('hero', url)}
                  />
                  <ImageUploader 
                    businessSlug={business.slug}
                    imageType="about"
                    currentUrl={aboutImageUrl}
                    onUploadSuccess={(url) => handleImageSuccess('about', url)}
                  />
                  <ImageUploader 
                    businessSlug={business.slug}
                    imageType="logo"
                    currentUrl={logoUrl}
                    onUploadSuccess={(url) => handleImageSuccess('logo', url)}
                  />
                </>
              )}
            </div>
          </div>

          {/* Template Preview */}
          <div className="border-t pt-4">
            <div className="flex gap-3">
              <a 
                href={`/${selectedTemplate}/${business.slug}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-block text-center font-medium"
              >
                🚀 View Live {business.name} Website
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function NotesTab({ business }: { business: Business }) {
  const [notes, setNotes] = useState('')

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Notes</h3>
        
        <div className="space-y-4">
          <div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes about this business..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Save Notes
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function ActivitiesTab({ business }: { business: Business }) {
  const [callLogs, setCallLogs] = useState<any[]>([])
  const [newCall, setNewCall] = useState({
    outcome: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: business.phone || '',
    notes: ''
  })
  const [showNewCall, setShowNewCall] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load existing call logs
  useEffect(() => {
    loadCallLogs()
  }, [business.id])

  const loadCallLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .eq('business_id', business.id)
        .order('call_date', { ascending: false })

      if (!error && data) {
        setCallLogs(data)
      }
    } catch (error) {
      console.error('Error loading call logs:', error)
    }
  }

  const saveCallLog = async () => {
    if (!newCall.outcome) {
      alert('Please select a call outcome')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('call_logs')
        .insert({
          business_id: business.id,
          call_date: new Date().toISOString(),
          outcome: newCall.outcome,
          owner_name: newCall.ownerName,
          owner_email: newCall.ownerEmail,
          owner_phone: newCall.ownerPhone,
          notes: newCall.notes,
          user_name: currentAdminUser || 'unknown'
        })

      if (!error) {
        // Reset form
        setNewCall({
          outcome: '',
          ownerName: '',
          ownerEmail: '',
          ownerPhone: business.phone || '',
          notes: ''
        })
        setShowNewCall(false)
        // Reload logs
        loadCallLogs()
      } else {
        console.error('Error saving call log:', error)
        alert('Error saving call log')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error saving call log')
    } finally {
      setLoading(false)
    }
  }

  // Check if user is authenticated admin
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentAdminUser, setCurrentAdminUser] = useState<string>('')
  
  useEffect(() => {
    // Check admin status from cookies
    const adminAuth = document.cookie
      .split('; ')
      .find(row => row.startsWith('admin_authenticated='))
      ?.split('=')[1]
    
    const adminUser = document.cookie
      .split('; ')
      .find(row => row.startsWith('admin_username='))
      ?.split('=')[1]
    
    console.log('🍪 All cookies:', document.cookie)
    console.log('🔐 Admin auth cookie value:', adminAuth)
    console.log('🔐 Admin username cookie value:', adminUser)
    console.log('🔐 Setting isAdmin to:', adminAuth === 'true')
    
    setIsAdmin(adminAuth === 'true')
    setCurrentAdminUser(adminUser || '')
  }, [])

  const openNativeSMS = (callLog: any) => {
    console.log('📱 openNativeSMS called')
    console.log('🔐 isAdmin status:', isAdmin)
    
    // Determine template type based on business type
    const templateMap: { [key: string]: string } = {
      'plumbing': 'plumbing-pro',
      'hvac': 'hvac',
      'pest-control': 'pest-control',
      'pressure-washing': 'pressure-washing',
      'tree-service': 'tree-service',
      'roofing': 'roofing',
      'fire-protection': 'fire-protection'
    }
    
    const templateType = templateMap[business.business_type?.toLowerCase() || ''] || 'hvac'
    const templateUrl = `${window.location.origin}/${templateType}/${business.slug}`
    
    console.log('🌐 Template URL generated:', templateUrl)
    console.log('📋 Template type:', templateType)
    
    // Create Nick's personalized message - use owner name if available, otherwise generic
    const firstName = callLog.owner_name ? callLog.owner_name.split(' ')[0] : null
    const message = firstName 
      ? `Hey ${firstName}, thank you for your time. Here is the website ${templateUrl}. Please let me know what you think. Thanks, Nick.`
      : `Thank you for your time. Here is the website ${templateUrl}. Please let me know what you think. Thanks, Nick.`
    
    // Use business phone, not owner phone
    const cleanPhone = business.phone.replace(/[^\d]/g, '')
    
    // Create SMS URL for native apps
    const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(message)}`
    
    console.log('📞 Opening SMS to business phone:', cleanPhone)
    console.log('💬 Message:', message)
    
    // Open native SMS app
    window.location.href = smsUrl
    
    // If admin is authenticated, also send to GoHighLevel
    if (isAdmin) {
      console.log('✅ Admin authenticated - sending to GoHighLevel')
      sendToGoHighLevel(callLog, templateUrl, templateType)
    } else {
      console.log('⚠️ Not admin - skipping GoHighLevel sync')
    }
  }

  const sendToGoHighLevel = async (callLog: any, templateUrl: string, templateType: string) => {
    console.log('🚀 Starting GoHighLevel sync')
    setLoading(true)
    try {
      // Simple payload - business data + optional call log data
      const webhookPayload = {
        business_name: business.name,
        business_phone: business.phone,
        owner_name: callLog.owner_name || '',
        owner_email: callLog.owner_email || '',
        notes: callLog.notes || ''
      }

      console.log('📤 Sending payload to GHL:', webhookPayload)

      const response = await fetch('/api/send-to-ghl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      })

      console.log('📨 GHL API Response Status:', response.status)
      console.log('📨 GHL API Response Headers:', Object.fromEntries(response.headers.entries()))
      
      let result
      try {
        result = await response.json()
        console.log('📨 GHL API Response Body:', result)
      } catch (jsonError) {
        console.error('❌ Failed to parse JSON response:', jsonError)
        const textResponse = await response.text()
        console.log('📨 Raw response:', textResponse)
        throw new Error(`Invalid JSON response: ${textResponse}`)
      }

      if (response.ok) {
        // Update call log to mark template as sent
        await supabase
          .from('call_logs')
          .update({
            template_sent: true,
            template_sent_date: new Date().toISOString(),
            template_url: templateUrl
          })
          .eq('id', callLog.id)

        console.log('✅ Contact sync successful')
        // Success feedback shown in UI - removed alert popup
        loadCallLogs() // Refresh to show updated status
      } else {
        console.error('❌ Contact sync failed:', result)
        const errorMsg = result?.error || 'Unknown error occurred'
        // Error logging only - removed alert popup
      }
    } catch (error) {
      console.error('❌ Error syncing contact:', error)
      console.error('❌ Error stack:', (error as any).stack)
      // Error logging only - removed alert popup
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getOutcomeColor = (outcome: string) => {
    switch (outcome.toLowerCase()) {
      case 'answered': return 'text-green-600 bg-green-100'
      case 'no answer': return 'text-yellow-600 bg-yellow-100'
      case 'not interested': return 'text-red-600 bg-red-100'
      case 'interested': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* New Call Button */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Call Log</h3>
          <button
            onClick={() => setShowNewCall(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            + Log New Call
          </button>
        </div>

        {/* New Call Form */}
        {showNewCall && (
          <div className="bg-gray-50 border rounded-lg p-6 mb-6">
            <h4 className="font-semibold text-gray-900 mb-4">Log New Call</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Call Outcome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Call Outcome *</label>
                <select
                  value={newCall.outcome}
                  onChange={(e) => setNewCall({...newCall, outcome: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select outcome...</option>
                  <option value="No Answer">No Answer</option>
                  <option value="Answered">Answered</option>
                  <option value="Interested">Interested</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Call Back Later">Call Back Later</option>
                </select>
              </div>

              {/* Owner Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Owner Phone</label>
                <input
                  type="tel"
                  value={newCall.ownerPhone}
                  onChange={(e) => setNewCall({...newCall, ownerPhone: e.target.value})}
                  placeholder="Phone number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Owner Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name</label>
                <input
                  type="text"
                  value={newCall.ownerName}
                  onChange={(e) => setNewCall({...newCall, ownerName: e.target.value})}
                  placeholder="Owner's name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Owner Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Owner Email</label>
                <input
                  type="email"
                  value={newCall.ownerEmail}
                  onChange={(e) => setNewCall({...newCall, ownerEmail: e.target.value})}
                  placeholder="owner@business.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Call Notes</label>
                <textarea
                  value={newCall.notes}
                  onChange={(e) => setNewCall({...newCall, notes: e.target.value})}
                  placeholder="Notes about the call..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={saveCallLog}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : 'Save Call Log'}
              </button>
              <button
                onClick={() => setShowNewCall(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Call Logs List */}
        <div className="space-y-4">
          {callLogs.length > 0 ? (
            callLogs.map((log, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getOutcomeColor(log.outcome)}`}>
                        {log.outcome}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatDate(log.call_date)}
                      </span>
                      {log.template_sent && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full text-purple-600 bg-purple-100">
                          Template Sent
                        </span>
                      )}
                    </div>
                    
                    {(log.owner_name || log.owner_email || log.owner_phone) && (
                      <div className="text-sm text-gray-700 space-y-1">
                        {log.owner_name && <div><strong>Owner:</strong> {log.owner_name}</div>}
                        {log.owner_email && <div><strong>Email:</strong> {log.owner_email}</div>}
                        {log.owner_phone && <div><strong>Phone:</strong> {log.owner_phone}</div>}
                      </div>
                    )}
                    
                    {log.notes && (
                      <div className="text-sm text-gray-600 mt-2 italic">
                        "{log.notes}"
                      </div>
                    )}

                    {log.template_sent && log.template_url && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-600">Template sent: </span>
                        <a href={log.template_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View Template
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Send Template Button */}
                  {(log.outcome === 'Answered' || log.outcome === 'Interested') && !log.template_sent && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => openNativeSMS(log)}
                        disabled={loading}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm font-medium disabled:bg-gray-400 flex items-center gap-2"
                      >
                        {loading ? '⏳' : '📱'} Send Template
                      </button>
                      {isAdmin && (
                        <span className="text-xs text-green-600">✓ Admin - GHL sync enabled</span>
                      )}
                      {!isAdmin && (
                        <span className="text-xs text-gray-500">⚠️ Not admin - SMS only</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📞</div>
              <div className="font-medium">No calls logged yet</div>
              <div className="text-sm">Click "Log New Call" to get started</div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}