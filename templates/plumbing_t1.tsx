import React from 'react'
import { Business } from '@/types/business'
import Image from 'next/image'

interface PlumbingT1Props {
  business: Business
}

export default function PlumbingT1({ business }: PlumbingT1Props) {
  const displayEmail = business.email1_status === 'valid' 
    ? business.email1 
    : `example@${business.site ? new URL(business.site).hostname.replace('www.', '') : `${business.slug}.com`}`

  const services = [
    {
      title: 'Leak Repair',
      description: 'Fast and reliable leak detection and repair services for your home or business.',
      icon: '🔧'
    },
    {
      title: 'Drain Cleaning',
      description: 'Professional drain cleaning to keep your pipes flowing smoothly.',
      icon: '🚿'
    },
    {
      title: 'Water Heaters',
      description: 'Installation, repair, and maintenance of water heating systems.',
      icon: '🔥'
    },
    {
      title: 'Fixture Install',
      description: 'Expert installation of sinks, toilets, faucets, and other fixtures.',
      icon: '🚽'
    }
  ]

  const reviews = [
    {
      name: 'Sarah Johnson',
      rating: 5,
      text: 'Excellent service! Quick response time and professional work. Highly recommend for any plumbing needs.'
    },
    {
      name: 'Mike Rodriguez',
      rating: 5,
      text: 'Fixed my water heater issue same day. Fair pricing and quality workmanship. Will definitely use again.'
    },
    {
      name: 'Lisa Chen',
      rating: 5,
      text: 'Professional, courteous, and efficient. Solved my drain problem quickly and cleaned up after themselves.'
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
            src="/stock/plumbing/hero.jpg"
            alt="Professional plumbing services"
            fill
            className="object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{business.name}</h1>
            <p className="text-xl md:text-2xl mb-6">Professional Plumbing Services in {business.city}, {business.state}</p>
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
                At {business.name}, we provide reliable and professional plumbing services to homes and businesses 
                throughout {business.city} and the surrounding areas. With years of experience and a commitment to 
                quality workmanship, we're your trusted local plumbing experts.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                Our team of licensed and insured plumbers is available for emergency repairs, routine maintenance, 
                and new installations. We pride ourselves on transparent pricing, prompt service, and complete 
                customer satisfaction.
              </p>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--primary)]">{business.reviews}+</div>
                  <div className="text-sm text-gray-600">Happy Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--primary)]">24/7</div>
                  <div className="text-sm text-gray-600">Emergency Service</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--primary)]">Licensed</div>
                  <div className="text-sm text-gray-600">& Insured</div>
                </div>
              </div>
            </div>
            <div className="relative h-96">
              <Image
                src="/stock/plumbing/about.jpg"
                alt="Professional plumber at work"
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
            <p className="text-lg text-gray-600">Complete plumbing solutions for your home and business</p>
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
            <p className="text-lg text-gray-600">Get in touch for all your plumbing needs</p>
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
