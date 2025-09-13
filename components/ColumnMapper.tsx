'use client'
import { useState } from 'react'

// Define the biz table schema mapping
export const BIZ_TABLE_FIELDS = {
  // Core business info
  name: { label: 'Business Name', required: true, type: 'text' },
  niche: { label: 'Industry/Niche', required: false, type: 'text' },
  slug: { label: 'URL Slug', required: false, type: 'text' },
  category: { label: 'Category', required: false, type: 'text' },
  site: { label: 'Website URL', required: false, type: 'text' },
  
  // Contact
  phone: { label: 'Phone Number', required: false, type: 'text' },
  phone_carrier_type: { label: 'Phone Carrier Type', required: false, type: 'text' },
  
  // Address
  addr1: { label: 'Street Address', required: false, type: 'text' },
  city: { label: 'City', required: false, type: 'text' },
  state: { label: 'State/Province', required: false, type: 'text' },
  postal: { label: 'ZIP/Postal Code', required: false, type: 'text' },
  country: { label: 'Country', required: false, type: 'text' },
  latitude: { label: 'Latitude', required: false, type: 'number' },
  longitude: { label: 'Longitude', required: false, type: 'number' },
  
  // Reputation
  rating: { label: 'Rating', required: false, type: 'number' },
  reviews: { label: 'Number of Reviews', required: false, type: 'number' },
  reviews_link: { label: 'Reviews Link', required: false, type: 'text' },
  photos_count: { label: 'Photos Count', required: false, type: 'number' },
  
  // Profile
  about: { label: 'About/Description', required: false, type: 'text' },
  description: { label: 'Additional Description', required: false, type: 'text' },
  logo: { label: 'Logo URL', required: false, type: 'text' },
  verified: { label: 'Verified Status', required: false, type: 'boolean' },
  booking_appointment_link: { label: 'Booking Link', required: false, type: 'text' },
  place_id: { label: 'Google Place ID', required: false, type: 'text' },
  
  // Email contacts
  email1: { label: 'Primary Email', required: false, type: 'email' },
  email1_status: { label: 'Primary Email Status', required: false, type: 'text' },
  email1_first_name: { label: 'Primary Contact First Name', required: false, type: 'text' },
  email1_last_name: { label: 'Primary Contact Last Name', required: false, type: 'text' },
  email1_title: { label: 'Primary Contact Title', required: false, type: 'text' },
  
  email2: { label: 'Secondary Email', required: false, type: 'email' },
  email2_status: { label: 'Secondary Email Status', required: false, type: 'text' },
  email2_first_name: { label: 'Secondary Contact First Name', required: false, type: 'text' },
  email2_last_name: { label: 'Secondary Contact Last Name', required: false, type: 'text' },
  email2_title: { label: 'Secondary Contact Title', required: false, type: 'text' },
  
  // Social media
  facebook: { label: 'Facebook URL', required: false, type: 'text' },
  instagram: { label: 'Instagram URL', required: false, type: 'text' },
  linkedin: { label: 'LinkedIn URL', required: false, type: 'text' },
  tiktok: { label: 'TikTok URL', required: false, type: 'text' },
  
  // Website tracking
  website_generator: { label: 'Website Platform', required: false, type: 'text' },
  website_description: { label: 'Website Description', required: false, type: 'text' },
  
  // Demo/experiment
  owner: { label: 'Business Owner', required: false, type: 'text' },
  experimentid: { label: 'Experiment ID', required: false, type: 'text' }
} as const

interface ColumnMapperProps {
  csvHeaders: string[]
  sampleData: any[]
  onMappingComplete: (mapping: Record<string, string>) => void
  onCancel: () => void
}

export default function ColumnMapper({ 
  csvHeaders, 
  sampleData, 
  onMappingComplete, 
  onCancel 
}: ColumnMapperProps) {
  const [mapping, setMapping] = useState<Record<string, string>>(() => {
    // Auto-suggest mappings based on similar column names
    const autoMapping: Record<string, string> = {}
    
    csvHeaders.forEach(header => {
      const lowerHeader = header.toLowerCase().trim()
      
      // Common mappings
      const commonMappings: Record<string, string> = {
        'name': 'name',
        'business_name': 'name',
        'company_name': 'name',
        'business name': 'name',
        'company name': 'name',
        'phone': 'phone',
        'phone_number': 'phone',
        'telephone': 'phone',
        'email': 'email1',
        'email_address': 'email1',
        'address': 'addr1',
        'street': 'addr1',
        'street_address': 'addr1',
        'city': 'city',
        'state': 'state',
        'zip': 'postal',
        'zipcode': 'postal',
        'postal_code': 'postal',
        'website': 'site',
        'url': 'site',
        'rating': 'rating',
        'reviews': 'reviews',
        'latitude': 'latitude',
        'longitude': 'longitude',
        'lat': 'latitude',
        'lng': 'longitude',
        'lon': 'longitude',
        'category': 'category',
        'industry': 'niche',
        'niche': 'niche',
        'type': 'category'
      }
      
      if (commonMappings[lowerHeader]) {
        autoMapping[header] = commonMappings[lowerHeader]
      } else {
        // Check for partial matches
        for (const [csvPattern, dbField] of Object.entries(commonMappings)) {
          if (lowerHeader.includes(csvPattern) || csvPattern.includes(lowerHeader)) {
            autoMapping[header] = dbField
            break
          }
        }
      }
    })
    
    return autoMapping
  })

  const handleMappingChange = (csvColumn: string, dbField: string) => {
    setMapping(prev => ({
      ...prev,
      [csvColumn]: dbField
    }))
  }

  const handleSubmit = () => {
    // Filter out empty mappings
    const finalMapping = Object.fromEntries(
      Object.entries(mapping).filter(([_, value]) => value !== '')
    )
    onMappingComplete(finalMapping)
  }

  const requiredFieldsMapped = Object.values(mapping).includes('name')

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Map CSV Columns to Database Fields</h3>
      <p className="text-gray-600 mb-6">
        Match your CSV columns to the appropriate database fields. Only mapped columns will be imported.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column Mapping */}
        <div>
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
                  {Object.entries(BIZ_TABLE_FIELDS).map(([field, config]) => (
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
                  {csvHeaders.map(header => (
                    <div key={header} className="flex justify-between py-1">
                      <span className="text-gray-700 truncate mr-2">{header}:</span>
                      <span className="text-gray-900 truncate">{row[header] || 'N/A'}</span>
                    </div>
                  ))}
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
              Make sure to map at least one column to "Business Name".
            </p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">Import Summary:</h5>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• {sampleData.length} rows will be processed</li>
            <li>• {Object.values(mapping).filter(v => v !== '').length} columns will be imported</li>
            <li>• Duplicate slugs will be skipped automatically</li>
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
          Import Data
        </button>
      </div>
    </div>
  )
}