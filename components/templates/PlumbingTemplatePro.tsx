'use client'

import React, { useEffect, useState } from 'react'
import { Business } from '@/types/business'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { resolveBusinessImages } from '@/lib/images'

interface PlumbingTemplateProProps {
  business: Business
}

export default function PlumbingTemplatePro({ business }: PlumbingTemplateProProps) {
  const displayEmail = business.email1_status === 'valid' 
    ? business.email1 
    : `info@${business.slug}.com`

  const rating = business.rating || 0
  const reviews = business.reviews || 0
  const displayCity = business.city || 'Local Area'
  const displayState = business.state || 'USA'
  
  // Resolve images using the new image system
  const images = resolveBusinessImages(business)
  
  // Check if business offers emergency service
  const hasEmergencyService = business.working_hours && Object.values(business.working_hours).some(hours => 
    hours?.toLowerCase().includes('24') || 
    hours?.toLowerCase().includes('emergency') ||
    hours?.toLowerCase().includes('24/7') ||
    hours?.toLowerCase().includes('24 hours')
  ) || business.name.toLowerCase().includes('emergency') || business.name.toLowerCase().includes('24')

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
      
      {/* Improved Navigation Header */}
      <nav className="bg-white shadow-lg border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo/Business Name */}
            <div className="flex items-center">
              <div className="text-2xl font-bold text-gray-900">
                {business.name}
              </div>
            </div>
            
            {/* Centered Desktop Navigation Menu */}
            <div className="hidden md:flex items-center justify-center flex-1">
              <div className="flex items-center space-x-8">
                <a href="#services" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 relative group">
                  Services
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                </a>
                <a href="#about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 relative group">
                  About
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                </a>
                <a href="#reviews" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 relative group">
                  Reviews
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                </a>
                <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 relative group">
                  Contact
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                </a>
              </div>
            </div>
            
            {/* Phone Number Button */}
            <div className="flex items-center">
              <a href={`tel:${business.phone}`} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg">
                {business.phone}
              </a>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <a href={`tel:${business.phone}`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm">
                Call
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 opacity-20">
          <Image
            src={images.heroUrl}
            alt="Professional plumbing services background"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6">
                Expert Plumbing Services in <span className="text-yellow-400">{displayCity}</span>
              </h1>
              <p className="text-xl lg:text-2xl mb-8 text-blue-100 leading-relaxed">
                {hasEmergencyService 
                  ? `24/7 Emergency Plumbing • Licensed & Insured • ${displayCity}, ${displayState}`
                  : `Professional Plumbing Solutions • Licensed & Insured • ${displayCity}, ${displayState}`
                }
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a 
                  href={`tel:${business.phone}`}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 text-center"
                >
                  📞 Call {business.phone}
                </a>
                <a 
                  href={`mailto:${displayEmail}`}
                  className="bg-white text-blue-900 border-2 border-white px-8 py-4 rounded-lg font-bold text-lg transition-all hover:bg-gray-100 text-center"
                >
                  Get Free Quote
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6 text-sm">
                {business.verified && (
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    Verified Business
                  </div>
                )}
                {rating >= 4 && (
                  <div className="flex items-center">
                    <div className="flex text-yellow-400 mr-2">
                      {[...Array(5)].map((_, i) => (
                        <span key={i}>{i < Math.floor(rating) ? '★' : '☆'}</span>
                      ))}
                    </div>
                    {rating} ({reviews} reviews)
                  </div>
                )}
                <div className="flex items-center">
                  <span className="mr-2">🛡️</span>
                  Licensed & Insured
                </div>
                {hasEmergencyService && (
                  <div className="flex items-center">
                    <span className="mr-2">🚨</span>
                    24/7 Emergency Service
                  </div>
                )}
              </div>
            </div>

            {/* Hero Contact Form */}
            <div className="lg:flex justify-center hidden">
              <div className="bg-white/10 backdrop-blur p-8 rounded-2xl">
                <h3 className="text-2xl font-bold mb-6">Get Instant Quote</h3>
                <form className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Your Name"
                    className="w-full px-4 py-3 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white placeholder-white/70 focus:outline-none focus:border-yellow-400"
                  />
                  <input 
                    type="tel" 
                    placeholder="Phone Number"
                    className="w-full px-4 py-3 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white placeholder-white/70 focus:outline-none focus:border-yellow-400"
                  />
                  <select className="w-full px-4 py-3 rounded-lg bg-white/90 backdrop-blur border border-white/50 text-gray-900 focus:outline-none focus:border-yellow-400 focus:bg-white">
                    <option value="" className="text-gray-600">Select Service</option>
                    <option value="emergency" className="text-gray-900">Emergency Repair</option>
                    <option value="drain" className="text-gray-900">Drain Cleaning</option>
                    <option value="water-heater" className="text-gray-900">Water Heater</option>
                    <option value="leak" className="text-gray-900">Leak Repair</option>
                    <option value="other" className="text-gray-900">Other</option>
                  </select>
                  <button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-lg font-bold transition">
                    Get Free Quote
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section - Moved Above Services */}
      <section id="about" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why Choose {business.name}?
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                With years of experience serving {business.city}, {business.state}, we've built our reputation on quality workmanship, honest pricing, and exceptional customer service. Our licensed and insured team is available 24/7 for emergency repairs.
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
                    <h3 className="font-semibold text-gray-900">24/7 Emergency Service</h3>
                    <p className="text-gray-600">Available around the clock for urgent plumbing issues</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Upfront Pricing</h3>
                    <p className="text-gray-600">No hidden fees - you'll know the cost before we start</p>
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
              <div className="w-full h-96 rounded-lg shadow-lg overflow-hidden relative">
                <Image
                  src={images.aboutUrl}
                  alt="About our plumbing services"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-yellow-400 text-blue-900 p-6 rounded-lg shadow-lg">
                <div className="text-2xl font-bold">15+</div>
                <div className="text-sm font-medium">Years Experience</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Professional Plumbing Services by {business.name} in {displayCity}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Expert plumbing solutions for residential and commercial properties throughout {displayCity}, {displayState}.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Emergency Repairs */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">🚨</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Emergency Repairs</h3>
              <p className="text-gray-600 mb-6">
                {hasEmergencyService ? '24/7 emergency' : 'Fast'} plumbing repairs for burst pipes, leaks, and urgent issues.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Burst pipe repair</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Emergency leak detection</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Water damage prevention</li>
              </ul>
            </div>

            {/* Drain Cleaning */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">🔧</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Drain Cleaning</h3>
              <p className="text-gray-600 mb-6">
                Professional drain cleaning and unclogging services for all types of blockages.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Main line cleaning</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Kitchen & bathroom drains</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Hydro jetting</li>
              </ul>
            </div>

            {/* Water Heaters */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">🔥</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Water Heaters</h3>
              <p className="text-gray-600 mb-6">
                Water heater installation, repair, and maintenance services.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Tank & tankless installation</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Repair & maintenance</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Energy-efficient upgrades</li>
              </ul>
            </div>

            {/* Fixture Installation */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">🚿</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Fixture Installation</h3>
              <p className="text-gray-600 mb-6">
                Professional installation of faucets, toilets, and plumbing fixtures.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Faucet installation</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Toilet repair & replacement</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Shower & bath installation</li>
              </ul>
            </div>

            {/* Leak Detection */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">💧</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Leak Detection</h3>
              <p className="text-gray-600 mb-6">
                Advanced leak detection and repair services to prevent water damage.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Electronic leak detection</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Slab leak repair</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Pipe replacement</li>
              </ul>
            </div>

            {/* Commercial Plumbing */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">🏢</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Commercial Plumbing</h3>
              <p className="text-gray-600 mb-6">
                Complete commercial plumbing services for businesses and properties.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Restaurant plumbing</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Office buildings</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Preventive maintenance</li>
              </ul>
            </div>
          </div>
        </div>
      </section>


      {/* Reviews Section - Improved Design */}
      <section id="reviews" className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say About {business.name}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Don't just take our word for it. Here's what satisfied customers throughout {displayCity} have to say about our plumbing services.
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
              // Fallback to generic reviews if no Google Reviews available
              <>
                <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex text-yellow-400 mb-4 text-lg">
                    <span>★★★★★</span>
                  </div>
                  <p className="text-gray-700 mb-6 italic">
                    "Fast, professional service! They fixed our water heater issue quickly and at a fair price. {business.name} is now our go-to plumber!"
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-bold">SM</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Sarah M.</div>
                      <div className="text-sm text-gray-500">{displayCity} Resident</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex text-yellow-400 mb-4 text-lg">
                    <span>★★★★★</span>
                  </div>
                  <p className="text-gray-700 mb-6 italic">
                    "Emergency service at 2 AM - they were there within an hour and fixed our burst pipe perfectly. True professionals!"
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-bold">MR</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Mike R.</div>
                      <div className="text-sm text-gray-500">Business Owner</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex text-yellow-400 mb-4 text-lg">
                    <span>★★★★★</span>
                  </div>
                  <p className="text-gray-700 mb-6 italic">
                    "Professional, clean, and honest. They explained everything clearly and the work was done perfectly. Highly recommend!"
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-bold">JL</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Jennifer L.</div>
                      <div className="text-sm text-gray-500">Homeowner</div>
                    </div>
                  </div>
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

      {/* Service Area Section with Google Map */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Proudly Serving {displayCity} and Surrounding Areas
            </h2>
            <p className="text-lg text-blue-100 max-w-3xl mx-auto">
              Professional plumbing services throughout {displayCity}, {displayState} and surrounding communities. See our service area on the map below.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Service Types */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-800 p-6 rounded-lg text-center">
                <div className="text-4xl mb-3">🏠</div>
                <div className="font-semibold text-lg">Residential</div>
                <div className="text-sm text-blue-100 mt-2">Homes & Apartments</div>
              </div>
              <div className="bg-blue-800 p-6 rounded-lg text-center">
                <div className="text-4xl mb-3">🏢</div>
                <div className="font-semibold text-lg">Commercial</div>
                <div className="text-sm text-blue-100 mt-2">Offices & Retail</div>
              </div>
              <div className="bg-blue-800 p-6 rounded-lg text-center">
                <div className="text-4xl mb-3">⚡</div>
                <div className="font-semibold text-lg">Emergency</div>
                <div className="text-sm text-blue-100 mt-2">24/7 Service</div>
              </div>
              <div className="bg-blue-800 p-6 rounded-lg text-center">
                <div className="text-4xl mb-3">🛠️</div>
                <div className="font-semibold text-lg">Maintenance</div>
                <div className="text-sm text-blue-100 mt-2">Preventive Care</div>
              </div>
            </div>
            
            {/* Google Map */}
            <div className="relative">
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur">
                <h3 className="text-xl font-semibold mb-4 text-center">Our Service Area</h3>
                {business.latitude && business.longitude ? (
                  <div className="bg-white/20 h-[300px] rounded-lg flex items-center justify-center relative overflow-hidden">
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-60"
                      style={{
                        backgroundImage: `url(https://maps.googleapis.com/maps/api/staticmap?center=${business.latitude},${business.longitude}&zoom=12&size=400x300&maptype=roadmap&markers=color:red%7C${business.latitude},${business.longitude}&key=AIzaSyDJe6jp7mNRZm-dAGFAMrSSADU5KwD0vtc)`
                      }}
                    />
                    <div className="relative z-10 text-center">
                      <div className="text-4xl mb-2">📍</div>
                      <div className="font-semibold text-lg">{displayCity}, {displayState}</div>
                      <div className="text-sm text-blue-100">Click to view on Google Maps</div>
                      <a 
                        href={`https://www.google.com/maps?q=${business.latitude},${business.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 bg-white/90 text-blue-900 px-4 py-2 rounded-full text-sm font-medium hover:bg-white transition"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/20 h-[300px] rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📍</div>
                      <div className="font-semibold">Service Area</div>
                      <div className="text-sm text-blue-100">{displayCity}, {displayState}</div>
                    </div>
                  </div>
                )}
                <div className="mt-4 text-center">
                  <p className="text-blue-100 text-sm">
                    Located in {displayCity}, serving the greater {displayState} area
                  </p>
                  <a 
                    href={`tel:${business.phone}`}
                    className="inline-block mt-2 bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2 rounded-full font-semibold transition"
                  >
                    Call for Service: {business.phone}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Contact {business.name} today for reliable plumbing services you can trust.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Get In Touch</h3>
              {/* Clean Professional Contact Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 w-32">Phone</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <a href={`tel:${business.phone}`} className="text-blue-600 hover:underline font-medium">
                          {business.phone}
                        </a>
                      </td>
                    </tr>
                    {displayEmail && (
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">Email</td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <a href={`mailto:${displayEmail}`} className="text-blue-600 hover:underline font-medium">
                            {displayEmail}
                          </a>
                        </td>
                      </tr>
                    )}
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">Service Area</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {business.city}, {business.state}
                      </td>
                    </tr>
                    {(business.facebook || business.instagram || business.linkedin) && (
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">Social Media</td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div className="flex space-x-4">
                            {business.facebook && (
                              <a href={business.facebook} target="_blank" rel="noopener noreferrer" 
                                 className="text-blue-600 hover:underline">Facebook</a>
                            )}
                            {business.instagram && (
                              <a href={business.instagram} target="_blank" rel="noopener noreferrer" 
                                 className="text-blue-600 hover:underline">Instagram</a>
                            )}
                            {business.linkedin && (
                              <a href={business.linkedin} target="_blank" rel="noopener noreferrer" 
                                 className="text-blue-600 hover:underline">LinkedIn</a>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Request Service</h3>
              <form className="space-y-4">
                <div>
                  <input 
                    type="text" 
                    placeholder="Your Name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <input 
                    type="tel" 
                    placeholder="Phone Number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500">
                    <option value="">Select Service</option>
                    <option value="emergency">Emergency Repair</option>
                    <option value="drain">Drain Cleaning</option>
                    <option value="water-heater">Water Heater</option>
                    <option value="fixture">Fixture Installation</option>
                    <option value="leak">Leak Detection</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <textarea 
                    placeholder="Describe your plumbing issue..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-blue-700 transition">
                  Get Free Estimate
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">{business.name}</h3>
              <p className="text-gray-400 mb-4">
                Professional plumbing services in {displayCity}, {displayState}. Licensed, insured, and trusted by homeowners and businesses.
              </p>
              <div className="text-sm text-gray-500">
                Licensed & Insured • Serving {displayCity} & Surrounding Areas
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-4">Our Services</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Emergency Plumbing Repairs</li>
                <li>Drain Cleaning & Unclogging</li>
                <li>Water Heater Services</li>
                <li>Fixture Installation</li>
                <li>Leak Detection & Repair</li>
                <li>Commercial Plumbing</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-4">Contact Info</h3>
              <div className="space-y-2 text-gray-400">
                <div>📞 {business.phone}</div>
                <div>✉️ {displayEmail}</div>
                <div>📍 {displayCity}, {displayState}</div>
                {hasEmergencyService && <div className="text-yellow-400 font-semibold">⚡ 24/7 Emergency Service</div>}
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>© 2024 {business.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}