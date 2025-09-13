'use client'
import React, { useState } from 'react'
import { Business } from '@/types/business'
import BusinessDetailModal from './BusinessDetailModal'
import { createSlug } from '@/lib/leadToSlug'

interface BusinessCardProps {
  business: Business
}

export default function BusinessCard({ business }: BusinessCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const rating = business.rating || 0
  const reviews = business.reviews || 0
  const niche = business.niche?.toLowerCase() || ''
  const businessType = (business.business_type || business.niche || '').toLowerCase()
  const isPlumber = niche.includes('plumb') || niche.includes('drainage') || niche.includes('fontanero') || niche.includes('bathroom remodel')
  const isElectrician = niche.includes('electric')
  const isHVAC = niche.includes('hvac') || niche.includes('air conditioning') || niche.includes('heating')
  const hasWebsite = business.site && 
    !business.site.includes('facebook.com') && 
    !business.site.includes('yelp.com')

  // Determine the template type for demo URL
  const getTemplateType = () => {
    if (businessType.includes('plumb')) return 'plumbing'
    if (businessType.includes('hvac') || businessType.includes('heating') || businessType.includes('cooling') || businessType.includes('air')) return 'hvac'
    if (businessType.includes('fire') || businessType.includes('protection')) return 'fire-protection'
    if (businessType.includes('pest') || businessType.includes('control')) return 'pest-control'
    if (businessType.includes('pressure') || businessType.includes('washing') || businessType.includes('cleaning')) return 'pressure-washing'
    if (businessType.includes('roof')) return 'roofing'
    if (businessType.includes('tree') || businessType.includes('service')) return 'tree-service'
    return 'hvac' // default fallback
  }

  const templateType = getTemplateType()
  const slug = createSlug(business.name)
  const demoUrl = `/${templateType}/${slug}/`

  return (
    <>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border-l-4 border-l-blue-500">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-1">
              {business.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                isPlumber ? 'bg-blue-100 text-blue-700' : 
                isElectrician ? 'bg-yellow-100 text-yellow-700' : 
                'bg-green-100 text-green-700'
              }`}>
                {business.niche}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                hasWebsite ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {hasWebsite ? 'Has Website' : 'No Website'}
              </span>
            </div>
          </div>
        </div>

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center mb-3">
            <div className="flex text-yellow-400 text-sm">
              {[...Array(5)].map((_, i) => (
                <span key={i}>{i < Math.floor(rating) ? '★' : '☆'}</span>
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">
              {rating} ({reviews} reviews)
            </span>
          </div>
        )}

        {/* Location */}
        <div className="text-sm text-gray-600 mb-3">
          📍 {business.city}, {business.state}
        </div>

        {/* Phone */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm">
            📞 <a 
              href={`tel:${business.phone}`} 
              className="text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {business.phone}
            </a>
          </div>
        </div>

        {/* Website */}
        <div className="text-sm mb-4">
          {hasWebsite ? (
            <div>
              🌐 <a 
                href={business.site} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Visit Website
              </a>
            </div>
          ) : (
            <div className="text-gray-500">🌐 No website</div>
          )}
        </div>

        {/* Email Status */}
        {business.email1 && (
          <div className="text-xs text-gray-500 mb-3">
            📧 {business.email1} 
            <span className={`ml-2 px-1 py-0.5 rounded ${
              business.email1_status?.toLowerCase() === 'invalid' 
                ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {business.email1_status?.toLowerCase() === 'invalid' ? 'Invalid' : 'Valid'}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button 
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              setShowDetails(true)
            }}
          >
            View Details
          </button>
          <a 
            href={demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-green-700 transition-colors text-center"
            onClick={(e) => e.stopPropagation()}
          >
            Demo URL
          </a>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetails && (
        <BusinessDetailModal 
          business={business} 
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  )
}