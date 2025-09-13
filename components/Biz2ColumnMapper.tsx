'use client'
import { useState } from 'react'

// Define the comprehensive "biz 2" table schema mapping
export const BIZ2_TABLE_FIELDS = {
  // Core business info
  query: { label: 'Search Query', required: false, type: 'text' },
  name: { label: 'Business Name', required: true, type: 'text' },
  name_for_emails: { label: 'Name for Emails', required: false, type: 'text' },
  site: { label: 'Website URL', required: false, type: 'text' },
  subtypes: { label: 'Business Subtypes', required: false, type: 'text' },
  category: { label: 'Category', required: false, type: 'text' },
  type: { label: 'Business Type', required: false, type: 'text' },
  
  // Primary phone and enrichment
  phone: { label: 'Primary Phone', required: false, type: 'text' },
  'phone.phones_enricher.carrier_type': { label: 'Phone Carrier Type', required: false, type: 'text' },
  'phone.phones_enricher.carrier_name': { label: 'Phone Carrier Name', required: false, type: 'text' },
  
  // Address fields
  full_address: { label: 'Full Address', required: false, type: 'text' },
  borough: { label: 'Borough', required: false, type: 'text' },
  street: { label: 'Street Address', required: false, type: 'text' },
  city: { label: 'City', required: false, type: 'text' },
  postal_code: { label: 'Postal Code', required: false, type: 'text' },
  state: { label: 'State', required: false, type: 'text' },
  us_state: { label: 'US State', required: false, type: 'text' },
  country: { label: 'Country', required: false, type: 'text' },
  country_code: { label: 'Country Code', required: false, type: 'text' },
  latitude: { label: 'Latitude', required: false, type: 'number' },
  longitude: { label: 'Longitude', required: false, type: 'number' },
  h3: { label: 'H3 Geohash', required: false, type: 'text' },
  time_zone: { label: 'Time Zone', required: false, type: 'text' },
  plus_code: { label: 'Plus Code', required: false, type: 'text' },
  area_service: { label: 'Area Service', required: false, type: 'boolean' },
  
  // Reviews and ratings
  rating: { label: 'Rating', required: false, type: 'text' },
  reviews: { label: 'Number of Reviews', required: false, type: 'text' },
  reviews_link: { label: 'Reviews Link', required: false, type: 'text' },
  reviews_tags: { label: 'Reviews Tags', required: false, type: 'text' },
  reviews_per_score: { label: 'Reviews Per Score', required: false, type: 'text' },
  reviews_per_score_1: { label: 'Reviews Score 1', required: false, type: 'text' },
  reviews_per_score_2: { label: 'Reviews Score 2', required: false, type: 'text' },
  reviews_per_score_3: { label: 'Reviews Score 3', required: false, type: 'text' },
  reviews_per_score_4: { label: 'Reviews Score 4', required: false, type: 'text' },
  reviews_per_score_5: { label: 'Reviews Score 5', required: false, type: 'text' },
  
  // Photos and visuals
  photos_count: { label: 'Photos Count', required: false, type: 'text' },
  photo: { label: 'Primary Photo URL', required: false, type: 'text' },
  street_view: { label: 'Street View URL', required: false, type: 'text' },
  logo: { label: 'Logo URL', required: false, type: 'text' },
  
  // Business details
  located_in: { label: 'Located In', required: false, type: 'text' },
  working_hours: { label: 'Working Hours', required: false, type: 'text' },
  working_hours_csv_compatible: { label: 'Working Hours CSV', required: false, type: 'text' },
  working_hours_old_format: { label: 'Working Hours Old Format', required: false, type: 'text' },
  other_hours: { label: 'Other Hours', required: false, type: 'text' },
  popular_times: { label: 'Popular Times', required: false, type: 'text' },
  business_status: { label: 'Business Status', required: false, type: 'text' },
  about: { label: 'About (JSON)', required: false, type: 'json' },
  range: { label: 'Price Range', required: false, type: 'text' },
  prices: { label: 'Prices', required: false, type: 'text' },
  posts: { label: 'Posts', required: false, type: 'text' },
  description: { label: 'Description', required: false, type: 'text' },
  typical_time_spent: { label: 'Typical Time Spent', required: false, type: 'text' },
  verified: { label: 'Verified Status', required: false, type: 'text' },
  
  // Owner information
  owner_id: { label: 'Owner ID', required: false, type: 'text' },
  owner_title: { label: 'Owner Title', required: false, type: 'text' },
  owner_link: { label: 'Owner Link', required: false, type: 'text' },
  
  // Business links
  reservation_links: { label: 'Reservation Links', required: false, type: 'text' },
  booking_appointment_link: { label: 'Booking Link', required: false, type: 'text' },
  menu_link: { label: 'Menu Link', required: false, type: 'text' },
  order_links: { label: 'Order Links', required: false, type: 'text' },
  location_link: { label: 'Location Link', required: false, type: 'text' },
  location_reviews_link: { label: 'Location Reviews Link', required: false, type: 'text' },
  
  // Google identifiers
  place_id: { label: 'Google Place ID', required: false, type: 'text' },
  google_id: { label: 'Google ID', required: false, type: 'text' },
  cid: { label: 'CID', required: false, type: 'number' },
  kgmid: { label: 'Knowledge Graph ID', required: false, type: 'text' },
  reviews_id: { label: 'Reviews ID', required: false, type: 'text' },
  located_google_id: { label: 'Located Google ID', required: false, type: 'text' },
  
  // Email 1
  email_1: { label: 'Primary Email', required: false, type: 'email' },
  'email_1.emails_validator.status': { label: 'Primary Email Status', required: false, type: 'text' },
  'email_1.emails_validator.status_details': { label: 'Primary Email Status Details', required: false, type: 'text' },
  email_1_full_name: { label: 'Primary Contact Full Name', required: false, type: 'text' },
  email_1_first_name: { label: 'Primary Contact First Name', required: false, type: 'text' },
  email_1_last_name: { label: 'Primary Contact Last Name', required: false, type: 'text' },
  email_1_title: { label: 'Primary Contact Title', required: false, type: 'text' },
  email_1_phone: { label: 'Primary Contact Phone', required: false, type: 'text' },
  
  // Email 2
  email_2: { label: 'Secondary Email', required: false, type: 'email' },
  'email_2.emails_validator.status': { label: 'Secondary Email Status', required: false, type: 'text' },
  'email_2.emails_validator.status_details': { label: 'Secondary Email Status Details', required: false, type: 'text' },
  email_2_full_name: { label: 'Secondary Contact Full Name', required: false, type: 'text' },
  email_2_first_name: { label: 'Secondary Contact First Name', required: false, type: 'text' },
  email_2_last_name: { label: 'Secondary Contact Last Name', required: false, type: 'text' },
  email_2_title: { label: 'Secondary Contact Title', required: false, type: 'text' },
  email_2_phone: { label: 'Secondary Contact Phone', required: false, type: 'text' },
  
  // Email 3
  email_3: { label: 'Third Email', required: false, type: 'email' },
  'email_3.emails_validator.status': { label: 'Third Email Status', required: false, type: 'text' },
  'email_3.emails_validator.status_details': { label: 'Third Email Status Details', required: false, type: 'text' },
  email_3_full_name: { label: 'Third Contact Full Name', required: false, type: 'text' },
  email_3_first_name: { label: 'Third Contact First Name', required: false, type: 'text' },
  email_3_last_name: { label: 'Third Contact Last Name', required: false, type: 'text' },
  email_3_title: { label: 'Third Contact Title', required: false, type: 'text' },
  email_3_phone: { label: 'Third Contact Phone', required: false, type: 'text' },
  
  // Phone 1 (additional)
  phone_1: { label: 'Phone 1', required: false, type: 'text' },
  'phone_1.phones_enricher.carrier_name': { label: 'Phone 1 Carrier Name', required: false, type: 'text' },
  'phone_1.phones_enricher.carrier_type': { label: 'Phone 1 Carrier Type', required: false, type: 'text' },
  
  // Phone 2
  phone_2: { label: 'Phone 2', required: false, type: 'text' },
  'phone_2.phones_enricher.carrier_name': { label: 'Phone 2 Carrier Name', required: false, type: 'text' },
  'phone_2.phones_enricher.carrier_type': { label: 'Phone 2 Carrier Type', required: false, type: 'text' },
  
  // Phone 3
  phone_3: { label: 'Phone 3', required: false, type: 'text' },
  'phone_3.phones_enricher.carrier_name': { label: 'Phone 3 Carrier Name', required: false, type: 'text' },
  'phone_3.phones_enricher.carrier_type': { label: 'Phone 3 Carrier Type', required: false, type: 'text' },
  
  // Social media
  facebook: { label: 'Facebook URL', required: false, type: 'text' },
  instagram: { label: 'Instagram URL', required: false, type: 'text' },
  linkedin: { label: 'LinkedIn URL', required: false, type: 'text' },
  tiktok: { label: 'TikTok URL', required: false, type: 'text' },
  medium: { label: 'Medium URL', required: false, type: 'text' },
  reddit: { label: 'Reddit URL', required: false, type: 'text' },
  skype: { label: 'Skype Handle', required: false, type: 'text' },
  snapchat: { label: 'Snapchat Handle', required: false, type: 'text' },
  telegram: { label: 'Telegram Handle', required: false, type: 'text' },
  whatsapp: { label: 'WhatsApp URL', required: false, type: 'text' },
  twitter: { label: 'Twitter Handle', required: false, type: 'text' },
  vimeo: { label: 'Vimeo URL', required: false, type: 'text' },
  youtube: { label: 'YouTube URL', required: false, type: 'text' },
  github: { label: 'GitHub URL', required: false, type: 'text' },
  crunchbase: { label: 'Crunchbase URL', required: false, type: 'text' },
  
  // Website intelligence
  website_title: { label: 'Website Title', required: false, type: 'text' },
  website_generator: { label: 'Website Generator', required: false, type: 'text' },
  website_description: { label: 'Website Description', required: false, type: 'text' },
  website_keywords: { label: 'Website Keywords', required: false, type: 'text' },
  website_has_fb_pixel: { label: 'Has Facebook Pixel', required: false, type: 'text' },
  website_has_google_tag: { label: 'Has Google Tag', required: false, type: 'text' },
  
  // Company insights (simplified - main fields only)
  'company_insights.name': { label: 'Company Insights Name', required: false, type: 'text' },
  'company_insights.description': { label: 'Company Description', required: false, type: 'text' },
  'company_insights.employees': { label: 'Employee Count', required: false, type: 'text' },
  'company_insights.founded_year': { label: 'Founded Year', required: false, type: 'text' },
  'company_insights.industry': { label: 'Industry', required: false, type: 'text' },
  'company_insights.revenue': { label: 'Revenue', required: false, type: 'text' },
  'company_insights.is_public': { label: 'Is Public Company', required: false, type: 'text' },
} as const

interface Biz2ColumnMapperProps {
  csvHeaders: string[]
  sampleData: any[]
  onMappingComplete: (mapping: Record<string, string>) => void
  onCancel: () => void
}

export default function Biz2ColumnMapper({ 
  csvHeaders, 
  sampleData, 
  onMappingComplete, 
  onCancel 
}: Biz2ColumnMapperProps) {
  const [mapping, setMapping] = useState<Record<string, string>>(() => {
    // Auto-suggest mappings for common Outscraper fields
    const autoMapping: Record<string, string> = {}
    
    csvHeaders.forEach(header => {
      const lowerHeader = header.toLowerCase().trim()
      const exactMatch = Object.keys(BIZ2_TABLE_FIELDS).find(
        field => field.toLowerCase() === lowerHeader
      )
      
      if (exactMatch) {
        autoMapping[header] = exactMatch
        return
      }
      
      // Common field mappings
      const mappings: Record<string, string> = {
        'business_name': 'name',
        'company_name': 'name',
        'name': 'name',
        'website': 'site',
        'url': 'site',
        'phone_number': 'phone',
        'telephone': 'phone',
        'email': 'email_1',
        'email_address': 'email_1',
        'address': 'full_address',
        'street_address': 'street',
        'zip_code': 'postal_code',
        'zipcode': 'postal_code',
        'zip': 'postal_code',
        'rating': 'rating',
        'review_count': 'reviews',
        'reviews_count': 'reviews',
        'lat': 'latitude',
        'lng': 'longitude',
        'lon': 'longitude',
        'category': 'category',
        'business_type': 'type',
        'industry': 'type',
      }
      
      if (mappings[lowerHeader]) {
        autoMapping[header] = mappings[lowerHeader]
      }
    })
    
    return autoMapping
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const handleMappingChange = (csvColumn: string, dbField: string) => {
    setMapping(prev => ({
      ...prev,
      [csvColumn]: dbField
    }))
  }

  const handleSubmit = () => {
    const finalMapping = Object.fromEntries(
      Object.entries(mapping).filter(([_, value]) => value !== '')
    )
    onMappingComplete(finalMapping)
  }

  const requiredFieldsMapped = Object.values(mapping).includes('name')

  // Filter fields for display
  const fieldCategories = {
    core: ['name', 'site', 'category', 'type', 'phone'],
    contact: ['email_1', 'email_2', 'email_3', 'phone_1', 'phone_2', 'phone_3'],
    location: ['full_address', 'street', 'city', 'state', 'postal_code', 'country', 'latitude', 'longitude'],
    reviews: ['rating', 'reviews', 'reviews_link', 'photos_count'],
    social: ['facebook', 'instagram', 'linkedin', 'twitter', 'youtube'],
    business: ['working_hours', 'business_status', 'verified', 'description'],
    website: ['website_title', 'website_generator', 'website_description']
  }

  const filteredFields = Object.entries(BIZ2_TABLE_FIELDS).filter(([field, config]) => {
    if (searchTerm) {
      return config.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
             field.toLowerCase().includes(searchTerm.toLowerCase())
    }
    
    if (selectedCategory === 'all') return true
    return fieldCategories[selectedCategory as keyof typeof fieldCategories]?.includes(field)
  })

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Map CSV Columns to Biz 2 Database Fields</h3>
      <p className="text-gray-600 mb-6">
        Match your CSV columns to the comprehensive database fields. This table has {Object.keys(BIZ2_TABLE_FIELDS).length}+ fields available.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column Mapping */}
        <div>
          <div className="flex flex-col space-y-3 mb-4">
            <input
              type="text"
              placeholder="Search database fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Fields ({Object.keys(BIZ2_TABLE_FIELDS).length})</option>
              <option value="core">Core Business (5)</option>
              <option value="contact">Contact Info (6)</option>
              <option value="location">Location (9)</option>
              <option value="reviews">Reviews & Rating (4)</option>
              <option value="social">Social Media (5)</option>
              <option value="business">Business Details (6)</option>
              <option value="website">Website Info (3)</option>
            </select>
          </div>
          
          <h4 className="font-medium text-gray-900 mb-3">Column Mappings</h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {csvHeaders.map(header => (
              <div key={header} className="flex flex-col space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  CSV: {header}
                </label>
                <select
                  value={mapping[header] || ''}
                  onChange={(e) => handleMappingChange(header, e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Skip this column --</option>
                  {filteredFields.map(([field, config]) => (
                    <option key={field} value={field}>
                      {config.label} {config.required && '*'}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Data Preview</h4>
          <div className="border border-gray-300 rounded-md p-3 bg-gray-50 max-h-96 overflow-auto">
            <div className="text-xs font-mono">
              {sampleData.slice(0, 3).map((row, idx) => (
                <div key={idx} className="mb-4 pb-2 border-b border-gray-300 last:border-b-0">
                  <div className="font-medium text-gray-600 mb-1">Row {idx + 1}:</div>
                  {csvHeaders.slice(0, 10).map(header => (
                    <div key={header} className="flex justify-between py-1">
                      <span className="text-gray-700 truncate mr-2">{header}:</span>
                      <span className="text-gray-900 truncate max-w-32" title={row[header]}>
                        {row[header] || 'N/A'}
                      </span>
                    </div>
                  ))}
                  {csvHeaders.length > 10 && (
                    <div className="text-gray-500 text-xs mt-2">
                      ... and {csvHeaders.length - 10} more columns
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Validation Messages */}
      <div className="mt-6">
        {!requiredFieldsMapped && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 text-sm">
              <strong>Warning:</strong> Business Name is required but not mapped.
            </p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">Import Summary:</h5>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• {sampleData.length} rows will be processed</li>
            <li>• {Object.values(mapping).filter(v => v !== '').length} columns mapped</li>
            <li>• Importing to comprehensive "biz 2" table</li>
            <li>• Supports all Outscraper data fields</li>
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4 mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!requiredFieldsMapped}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Import to Biz 2 Table
        </button>
      </div>
    </div>
  )
}