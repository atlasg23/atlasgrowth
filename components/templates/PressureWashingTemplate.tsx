'use client'

import React, { useEffect, useState } from 'react'
import { Business } from '@/types/business'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

interface PressureWashingTemplateEnhancedProps {
  business: Business
}

export default function PressureWashingTemplateEnhanced({ business }: PressureWashingTemplateEnhancedProps) {
  const displayEmail = business.email1_status === 'valid' 
    ? business.email1 
    : `info@${business.slug}.com`

  const rating = business.rating || 0
  const reviews = business.reviews || 0
  const displayCity = business.city || 'Local Area'
  const displayState = business.state || 'USA'

  // State for Google Reviews
  const [googleReviews, setGoogleReviews] = useState<any[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)

  // Fetch Google Reviews on mount
  useEffect(() => {
    const fetchReviews = async () => {
      if (business.place_id) {
        try {
          const { data, error } = await supabase
            .from('google_reviews')
            .select('*')
            .eq('place_id', business.place_id)
            .gte('stars', 4) // Only get 4 and 5 star reviews
            .order('review_date', { ascending: false })
            .limit(10)

          if (!error && data) {
            // Filter for reviews with text and get top 3
            const reviewsWithText = data.filter(r => r.review_text && r.review_text.length > 20)
            setGoogleReviews(reviewsWithText.slice(0, 3))
          }
        } catch (error) {
          console.error('Error fetching reviews:', error)
        }
      }
      setReviewsLoading(false)
    }

    fetchReviews()
  }, [business.place_id])

  // Get Google Maps URL for reviews
  const googleMapsUrl = business.place_id 
    ? `https://www.google.com/maps/place/?q=place_id:${business.place_id}`
    : `https://www.google.com/maps/search/${encodeURIComponent(business.name + ' ' + business.city + ' ' + business.state)}`

  return (
    <div className="min-h-screen bg-white">
      {/* Template View Tracker */}
      
      {/* Navigation Header */}
      <nav className="bg-white shadow-lg border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo/Business Name */}
            <div className="flex items-center">
              <div className="text-2xl font-bold text-gray-900">
                {business.name}
              </div>
            </div>
            
            {/* Desktop Navigation Menu */}
            <div className="hidden md:flex items-center justify-center flex-1">
              <div className="flex items-center space-x-8">
                <a href="#services" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Services
                </a>
                <a href="#about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  About
                </a>
                <a href="#reviews" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Reviews
                </a>
                <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Contact
                </a>
              </div>
            </div>
            
            {/* Phone Number Button */}
            <div className="flex items-center">
              <a href={`tel:${business.phone}`} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg">
                {business.phone}
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-800 via-blue-700 to-cyan-700 text-white overflow-hidden">
        {/* Background Image with hero_image support */}
        <div className="absolute inset-0 opacity-30">
          <div 
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('${business.hero_image || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"}')`
            }}
          />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Professional Pressure Washing Services
              </h1>
              <p className="text-xl lg:text-2xl mb-8 text-blue-100">
                Transform your property with {business.name}'s expert cleaning services in {displayCity}, {displayState}
              </p>
              
              {/* Rating Display */}
              {rating >= 4 && reviews > 0 && (
                <div className="flex items-center mb-8">
                  <div className="flex text-yellow-400 text-2xl mr-3">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>{i < Math.floor(rating) ? '★' : '☆'}</span>
                    ))}
                  </div>
                  <span className="text-lg">{rating} ({reviews} reviews)</span>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <a href={`tel:${business.phone}`} className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl">
                  Get Free Quote
                </a>
                <a href="#contact" className="bg-white/20 hover:bg-white/30 backdrop-blur text-white px-8 py-4 rounded-lg font-bold text-lg transition-all border-2 border-white/50">
                  View Services
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section with about_image support */}
      <section id="about" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why Choose {business.name}?
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                With years of experience serving {displayCity} and surrounding areas, we've built our reputation on quality workmanship, eco-friendly cleaning solutions, and exceptional customer service.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Licensed & Insured</h3>
                    <p className="text-gray-600">Fully licensed professionals with comprehensive insurance coverage</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Eco-Friendly Solutions</h3>
                    <p className="text-gray-600">Safe for your family, pets, and the environment</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Satisfaction Guaranteed</h3>
                    <p className="text-gray-600">We stand behind our work with a 100% satisfaction guarantee</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div 
                className="w-full h-96 bg-cover bg-center rounded-lg shadow-lg"
                style={{
                  backgroundImage: `url('${business.about_image || "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"}')`
                }}
              />
              <div className="absolute -bottom-6 -right-6 bg-yellow-400 text-blue-900 p-6 rounded-lg shadow-lg">
                <div className="text-2xl font-bold">100%</div>
                <div className="text-sm font-medium">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our Pressure Washing Services
            </h2>
            <p className="text-xl text-gray-600">
              Professional cleaning solutions for residential and commercial properties
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* House Washing */}
            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">🏠</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">House Washing</h3>
              <p className="text-gray-600 mb-6">
                Gentle yet effective cleaning for vinyl siding, brick, stucco, and more.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Soft wash technique</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Mold & mildew removal</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Safe for all surfaces</li>
              </ul>
            </div>

            {/* Driveway & Concrete */}
            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">🚗</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Driveway Cleaning</h3>
              <p className="text-gray-600 mb-6">
                Restore your concrete surfaces to like-new condition.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Oil stain removal</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Sidewalk cleaning</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Patio restoration</li>
              </ul>
            </div>

            {/* Deck & Fence */}
            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">🪵</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Deck & Fence</h3>
              <p className="text-gray-600 mb-6">
                Revitalize your outdoor wood surfaces and structures.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Wood restoration</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Stain preparation</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Vinyl fence cleaning</li>
              </ul>
            </div>

            {/* Roof Cleaning */}
            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">🏡</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Roof Cleaning</h3>
              <p className="text-gray-600 mb-6">
                Safe, soft wash roof cleaning to remove algae and extend roof life.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Black streak removal</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Moss treatment</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> No pressure damage</li>
              </ul>
            </div>

            {/* Commercial */}
            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">🏢</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Commercial Services</h3>
              <p className="text-gray-600 mb-6">
                Professional cleaning for businesses and commercial properties.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Storefront cleaning</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Parking lot washing</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Building exteriors</li>
              </ul>
            </div>

            {/* Gutter Cleaning */}
            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">💧</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Gutter Cleaning</h3>
              <p className="text-gray-600 mb-6">
                Keep your gutters flowing freely and protect your foundation.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Debris removal</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Downspout clearing</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Gutter brightening</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="py-16 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Customer Reviews
            </h2>
            <p className="text-lg text-gray-600">
              See what our satisfied customers have to say
            </p>
            {rating >= 4 && reviews > 0 && (
              <div className="mt-6 flex items-center justify-center">
                <div className="flex text-yellow-400 text-2xl mr-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>{i < Math.floor(rating) ? '★' : '☆'}</span>
                  ))}
                </div>
                <div className="text-xl font-semibold text-gray-900">
                  {rating} out of 5 ({reviews} reviews)
                </div>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {googleReviews.length >= 3 ? (
              // Display actual Google Reviews if we have at least 3
              googleReviews.map((review, index) => (
                <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex text-yellow-400 mb-4 text-lg">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>{i < review.stars ? '★' : '☆'}</span>
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic line-clamp-4">
                    "{review.review_text}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-bold">
                        {review.reviewer_name ? review.reviewer_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'GR'}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{review.reviewer_name || 'Google User'}</div>
                      <div className="text-sm text-gray-500">
                        {review.is_local_guide ? 'Local Guide' : 'Verified Review'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Fallback to generic reviews
              <>
                <div className="bg-white p-8 rounded-xl shadow-lg">
                  <div className="flex text-yellow-400 mb-4 text-lg">
                    <span>★★★★★</span>
                  </div>
                  <p className="text-gray-700 mb-6 italic">
                    "Amazing service! They transformed our driveway and house exterior. Professional, punctual, and fair pricing."
                  </p>
                  <div className="font-semibold text-gray-900">John D.</div>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-lg">
                  <div className="flex text-yellow-400 mb-4 text-lg">
                    <span>★★★★★</span>
                  </div>
                  <p className="text-gray-700 mb-6 italic">
                    "Best pressure washing service in {displayCity}! They made our deck look brand new. Highly recommend!"
                  </p>
                  <div className="font-semibold text-gray-900">Sarah M.</div>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-lg">
                  <div className="flex text-yellow-400 mb-4 text-lg">
                    <span>★★★★★</span>
                  </div>
                  <p className="text-gray-700 mb-6 italic">
                    "Professional team, excellent results. Our commercial property has never looked better. Will use again!"
                  </p>
                  <div className="font-semibold text-gray-900">Mike R.</div>
                </div>
              </>
            )}
          </div>

          {/* View All Reviews Button */}
          {business.place_id && (
            <div className="text-center mt-10">
              <a 
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100-4h-.5a1 1 0 000-2H8a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-1a1 1 0 100-2h1a4 4 0 014 4v11a4 4 0 01-4 4H4a4 4 0 01-4-4V7a4 4 0 014-4z" clipRule="evenodd"/>
                </svg>
                View All Reviews on Google
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Get Your Free Quote Today</h2>
            <p className="text-xl text-gray-300">
              Contact {business.name} for professional pressure washing services
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📞</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Call Us</h3>
              <a href={`tel:${business.phone}`} className="text-2xl text-yellow-400 hover:text-yellow-300">
                {business.phone}
              </a>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📧</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Email Us</h3>
              <a href={`mailto:${displayEmail}`} className="text-lg text-yellow-400 hover:text-yellow-300">
                {displayEmail}
              </a>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Service Area</h3>
              <p className="text-lg text-gray-300">
                {displayCity}, {displayState}
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <a 
              href={`tel:${business.phone}`}
              className="inline-block bg-yellow-500 hover:bg-yellow-400 text-black px-12 py-4 rounded-lg font-bold text-xl transition-all shadow-lg hover:shadow-xl"
            >
              Call Now for Free Quote
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="mb-2">© 2024 {business.name}. All rights reserved.</p>
          <p className="text-gray-400">
            Professional Pressure Washing Services in {displayCity}, {displayState}
          </p>
        </div>
      </footer>
    </div>
  )
}