import React from 'react'
import { Business } from '@/types/business'
import Image from 'next/image'

interface HvacT1Props {
  business: Business
}

export default function HvacT1({ business }: HvacT1Props) {
  const displayEmail = business.email1_status === 'valid' 
    ? business.email1 
    : `example@${business.site ? new URL(business.site).hostname.replace('www.', '') : `${business.slug}.com`}`

  const services = [
    {
      title: 'AC Repair',
      description: 'Expert air conditioning repair and troubleshooting for all makes and models.',
      icon: '❄️'
    },
    {
      title: 'Heating Repair',
      description: 'Reliable heating system repair to keep you warm during cold months.',
      icon: '🔥'
    },
    {
      title: 'Installations',
      description: 'Professional installation of new HVAC systems and equipment.',
      icon: '🔧'
    },
    {
      title: 'Maintenance',
      description: 'Regular maintenance services to keep your HVAC system running efficiently.',
      icon: '⚙️'
    }
  ]

  const reviews = [
    {
      name: 'Jennifer Martinez',
      rating: 5,
      text: 'Outstanding HVAC service! They fixed our AC quickly and professionally. Great customer service and fair pricing.'
    },
    {
      name: 'David Thompson',
      rating: 5,
      text: 'Installed a new heating system for us. The team was knowledgeable, clean, and efficient. Highly recommend!'
    },
    {
      name: 'Maria Garcia',
      rating: 5,
      text: 'Emergency AC repair on a hot summer day. They came out same day and had us cool again within hours.'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              {business.logo_good && business.logo ? (
                <img src={business.logo} alt={`${business.name} logo`} className="h-12 w-auto" />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
              )}
            </div>
            <a 
              href={`tel:${business.phone}`}
              className="bg-[var(--primary)] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[var(--primary)]/90 transition-colors"
            >
              Call Now
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 text-white">
        <div className="absolute inset-0">
          <Image
            src="/stock/hvac/hero.jpg"
            alt="Professional HVAC services"
            fill
            className="object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{business.name}</h1>
            <p className="text-xl md:text-2xl mb-6">Professional HVAC Services in {business.city}, {business.state}</p>
            <div className="flex items-center justify-center mb-6">
              <div className="flex star-rating text-2xl">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>{i < Math.floor(business.rating) ? '★' : '☆'}</span>
                ))}
              </div>
              <span className="ml-2 text-lg">{business.rating} ({business.reviews} reviews)</span>
            </div>
            <a 
              href={`tel:${business.phone}`}
              className="bg-[var(--secondary)] text-white px-8 py-4 rounded-lg text-xl font-semibold hover:bg-[var(--secondary)]/90 transition-colors inline-block"
            >
              {business.phone}
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">About {business.name}</h2>
              <p className="text-lg text-gray-700 mb-6">
                At {business.name}, we provide comprehensive heating, ventilation, and air conditioning services 
                to keep your home or business comfortable year-round. Serving {business.city} and surrounding areas, 
                we're your trusted HVAC specialists.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                Our certified technicians have the expertise to handle all your HVAC needs, from emergency repairs 
                to energy-efficient system installations. We're committed to providing reliable service, competitive 
                pricing, and complete customer satisfaction.
              </p>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--primary)]">{business.reviews}+</div>
                  <div className="text-sm text-gray-600">Satisfied Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--primary)]">24/7</div>
                  <div className="text-sm text-gray-600">Emergency Service</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--primary)]">Certified</div>
                  <div className="text-sm text-gray-600">Technicians</div>
                </div>
              </div>
            </div>
            <div className="relative h-96">
              <Image
                src="/stock/hvac/about.jpg"
                alt="HVAC technician working"
                fill
                className="object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-lg text-gray-600">Complete HVAC solutions for your comfort needs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div key={index} className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-lg text-gray-600">Real reviews from satisfied customers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {reviews.map((review, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex star-rating text-yellow-400 mb-3">
                  {[...Array(review.rating)].map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-4">"{review.text}"</p>
                <p className="font-semibold text-gray-900">- {review.name}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <a 
              href={business.reviews_link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[var(--primary)] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[var(--primary)]/90 transition-colors"
            >
              Read More Reviews
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 contact-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-lg text-gray-600">Get in touch for all your HVAC needs</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="bg-[var(--primary)] text-white p-3 rounded-full mr-4">
                    📞
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Phone</h3>
                    <a href={`tel:${business.phone}`} className="text-[var(--primary)] hover:underline">
                      {business.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-[var(--primary)] text-white p-3 rounded-full mr-4">
                    ✉️
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <a href={`mailto:${displayEmail}`} className="text-[var(--primary)] hover:underline">
                      {displayEmail}
                    </a>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-[var(--primary)] text-white p-3 rounded-full mr-4">
                    📍
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Address</h3>
                    <p className="text-gray-700">{business.addr1}<br />{business.city}, {business.state} {business.postal}</p>
                  </div>
                </div>
                {(business.facebook || business.instagram) && (
                  <div className="flex items-center">
                    <div className="bg-[var(--primary)] text-white p-3 rounded-full mr-4">
                      📱
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Follow Us</h3>
                      <div className="flex space-x-4 mt-2">
                        {business.facebook && (
                          <a href={business.facebook} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">
                            Facebook
                          </a>
                        )}
                        {business.instagram && (
                          <a href={business.instagram} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">
                            Instagram
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
                <iframe
                  src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${business.latitude},${business.longitude}`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-lg"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
