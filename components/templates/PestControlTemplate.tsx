'use client'

import React from 'react'
import { Business } from '@/types/business'
import { ThemeProvider } from '@/components/ThemeProvider'

interface PestControlTemplateProps {
  business: Business
}

export default function PestControlTemplate({ business }: PestControlTemplateProps) {
  const displayEmail = business.email1_status === 'valid' 
    ? business.email1 
    : `info@${business.slug}.com`

  const displayCity = business.city || 'Your Area'

  return (
    <ThemeProvider primaryColor={business.primary_color || '#059669'} secondaryColor={business.secondary_color || '#DC2626'}>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-gradient-to-r from-green-600 to-green-700 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {business.name}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100">
              Expert Pest Control Services in {displayCity}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href={`tel:${business.phone}`} 
                className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors"
              >
                📞 Call {business.phone}
              </a>
              <a 
                href={`mailto:${displayEmail}`} 
                className="bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors"
              >
                ✉️ Get Quote
              </a>
            </div>
          </div>
        </header>

        {/* Services */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Pest Control Services</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 border rounded-lg">
                <div className="text-4xl mb-4">🐜</div>
                <h3 className="font-bold mb-2">Ant Control</h3>
                <p className="text-gray-600">Complete ant elimination & prevention</p>
              </div>
              <div className="text-center p-6 border rounded-lg">
                <div className="text-4xl mb-4">🪳</div>
                <h3 className="font-bold mb-2">Roach Control</h3>
                <p className="text-gray-600">Safe & effective roach removal</p>
              </div>
              <div className="text-center p-6 border rounded-lg">
                <div className="text-4xl mb-4">🕷️</div>
                <h3 className="font-bold mb-2">Spider Control</h3>
                <p className="text-gray-600">Spider treatment & prevention</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-gray-50 py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Contact {business.name}</h2>
            <div className="space-y-4">
              <p><strong>Phone:</strong> <a href={`tel:${business.phone}`} className="text-green-600">{business.phone}</a></p>
              <p><strong>Email:</strong> <a href={`mailto:${displayEmail}`} className="text-green-600">{displayEmail}</a></p>
              {business.site && <p><strong>Website:</strong> <a href={business.site} className="text-green-600">{business.site}</a></p>}
              <p><strong>Location:</strong> {business.city}, {business.state}</p>
            </div>
          </div>
        </section>
      </div>
    </ThemeProvider>
  )
}