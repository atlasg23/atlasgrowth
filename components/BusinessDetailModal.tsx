'use client'
import React from 'react'
import { Business } from '@/types/business'

interface BusinessDetailModalProps {
  business: Business
  onClose: () => void
}

export default function BusinessDetailModal({ business, onClose }: BusinessDetailModalProps) {
  const rating = business.rating || 0
  const reviews = business.reviews || 0
  const isPlumber = business.niche?.toLowerCase().includes('plumb')
  const hasWebsite = business.site && 
    !business.site.includes('facebook.com') && 
    !business.site.includes('yelp.com')

  // Parse working hours if available
  const workingHours = business.working_hours ? 
    Object.entries(business.working_hours).map(([day, hours]) => ({ day, hours })) : []

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{business.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 rounded text-sm font-medium ${
                isPlumber ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              }`}>
                {business.niche}
              </span>
              <span className={`px-2 py-1 rounded text-sm font-medium ${
                hasWebsite ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {hasWebsite ? 'Has Website' : 'No Website'}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Contact Info */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="text-gray-600 w-20">📞 Phone:</span>
                    <a 
                      href={`tel:${business.phone}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {business.phone}
                    </a>
                  </div>
                  
                  {business.email1 && (
                    <div className="flex items-center">
                      <span className="text-gray-600 w-20">📧 Email:</span>
                      <div>
                        <a 
                          href={`mailto:${business.email1}`}
                          className="text-blue-600 hover:underline"
                        >
                          {business.email1}
                        </a>
                        <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                          business.email1_status?.toLowerCase() === 'invalid' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {business.email1_status?.toLowerCase() === 'invalid' ? 'Invalid' : 'Valid'}
                        </span>
                      </div>
                    </div>
                  )}

                  {hasWebsite && (
                    <div className="flex items-center">
                      <span className="text-gray-600 w-20">🌐 Website:</span>
                      <a 
                        href={business.site}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {business.site}
                      </a>
                    </div>
                  )}
                </div>
              </section>

              {/* Location */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                <div className="space-y-2">
                  <div>📍 {business.addr1}</div>
                  <div className="text-gray-600">{business.city}, {business.state} {business.postal}</div>
                  {business.latitude && business.longitude && (
                    <div className="text-sm text-gray-500">
                      Coordinates: {business.latitude}, {business.longitude}
                    </div>
                  )}
                </div>
              </section>

              {/* Reputation */}
              {rating > 0 && (
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Reputation</h3>
                  <div className="flex items-center mb-2">
                    <div className="flex text-yellow-400 text-lg">
                      {[...Array(5)].map((_, i) => (
                        <span key={i}>{i < Math.floor(rating) ? '★' : '☆'}</span>
                      ))}
                    </div>
                    <span className="ml-2 text-gray-700">
                      {rating} out of 5 ({reviews} reviews)
                    </span>
                  </div>
                  {business.reviews_link && (
                    <a 
                      href={business.reviews_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Reviews →
                    </a>
                  )}
                </section>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Additional Emails */}
              {(business.email2 || business.email3) && (
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Contacts</h3>
                  <div className="space-y-2">
                    {business.email2 && (
                      <div className="text-sm">
                        📧 <a href={`mailto:${business.email2}`} className="text-blue-600 hover:underline">
                          {business.email2}
                        </a>
                        <span className={`ml-2 px-1 py-0.5 rounded text-xs ${
                          business.email2_status?.toLowerCase() === 'invalid' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {business.email2_status?.toLowerCase() === 'invalid' ? 'Invalid' : 'Valid'}
                        </span>
                      </div>
                    )}
                    {business.email3 && (
                      <div className="text-sm">
                        📧 <a href={`mailto:${business.email3}`} className="text-blue-600 hover:underline">
                          {business.email3}
                        </a>
                        <span className={`ml-2 px-1 py-0.5 rounded text-xs ${
                          business.email3_status?.toLowerCase() === 'invalid' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {business.email3_status?.toLowerCase() === 'invalid' ? 'Invalid' : 'Valid'}
                        </span>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Social Media */}
              {(business.facebook || business.instagram || business.linkedin) && (
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h3>
                  <div className="space-y-2">
                    {business.facebook && (
                      <div>
                        📘 <a href={business.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Facebook
                        </a>
                      </div>
                    )}
                    {business.instagram && (
                      <div>
                        📷 <a href={business.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Instagram
                        </a>
                      </div>
                    )}
                    {business.linkedin && (
                      <div>
                        💼 <a href={business.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          LinkedIn
                        </a>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Working Hours */}
              {workingHours.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Working Hours</h3>
                  <div className="space-y-1">
                    {workingHours.map(({ day, hours }) => (
                      <div key={day} className="flex justify-between text-sm">
                        <span className="font-medium">{day}:</span>
                        <span>{hours}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Business Details */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h3>
                <div className="space-y-2 text-sm">
                  {business.verified && (
                    <div className="flex items-center">
                      <span className="text-green-600">✓</span>
                      <span className="ml-2">Verified Business</span>
                    </div>
                  )}
                  {business.photos_count && (
                    <div>📸 {business.photos_count} photos available</div>
                  )}
                  {business.place_id && (
                    <div className="text-gray-500">Google Place ID: {business.place_id}</div>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* Description */}
          {business.description && (
            <section className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
              <p className="text-gray-700">{business.description}</p>
            </section>
          )}

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t flex gap-4">
            <a 
              href={`tel:${business.phone}`}
              className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 transition-colors"
            >
              📞 Call Now
            </a>
            {business.email1 && (
              <a 
                href={`mailto:${business.email1}`}
                className="bg-gray-600 text-white px-6 py-2 rounded font-medium hover:bg-gray-700 transition-colors"
              >
                📧 Send Email
              </a>
            )}
            {hasWebsite && (
              <a 
                href={business.site}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 text-white px-6 py-2 rounded font-medium hover:bg-green-700 transition-colors"
              >
                🌐 Visit Website
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}