interface GoogleMapsGeocodeResult {
  formatted_address: string
  address_components: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
}

interface GoogleMapsGeocodeResponse {
  status: string
  results: GoogleMapsGeocodeResult[]
}

export async function reverseGeocode(lat: number, lng: number): Promise<{
  city?: string
  state?: string
  country?: string
  formatted_address?: string
} | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    console.error('Google Maps API key not found')
    return null
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    )
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data: GoogleMapsGeocodeResponse = await response.json()
    
    if (data.status !== 'OK' || !data.results.length) {
      console.error('Geocoding failed:', data.status)
      return null
    }
    
    const result = data.results[0]
    let city: string | undefined
    let state: string | undefined
    let country: string | undefined
    
    // Extract city and state from address components
    for (const component of result.address_components) {
      if (component.types.includes('locality')) {
        city = component.long_name
      } else if (component.types.includes('administrative_area_level_2') && !city) {
        // Use county as fallback for city
        city = component.long_name
      } else if (component.types.includes('administrative_area_level_1')) {
        state = component.short_name // Use abbreviated state name
      } else if (component.types.includes('country')) {
        country = component.long_name
      }
    }
    
    return {
      city,
      state,
      country,
      formatted_address: result.formatted_address
    }
    
  } catch (error) {
    console.error('Error in reverse geocoding:', error)
    return null
  }
}

export async function bulkUpdateLocations(leadIds: string[]): Promise<{ updated: number; errors: number }> {
  // This would be used to bulk update leads that are missing city/state
  // Implementation would batch process leads with lat/lng but missing location data
  let updated = 0
  let errors = 0
  
  // This is a placeholder - in production you'd want to:
  // 1. Fetch leads with lat/lng but missing city/state
  // 2. Batch geocode requests (Google limits to avoid rate limiting)
  // 3. Update database with results
  
  return { updated, errors }
}