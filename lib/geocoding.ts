// Helper function to get city from coordinates or address using Google Maps API
export async function getCityFromLocation(address?: string, latitude?: number, longitude?: number): Promise<string | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    console.warn('Google Maps API key not found')
    return null
  }

  try {
    let url: string

    if (latitude && longitude) {
      // Reverse geocoding using coordinates
      url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
    } else if (address) {
      // Forward geocoding using address
      url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    } else {
      return null
    }

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0]
      
      // Extract city from address components
      for (const component of result.address_components) {
        if (component.types.includes('locality')) {
          return component.long_name
        }
        // Fallback to administrative_area_level_3 or sublocality
        if (component.types.includes('administrative_area_level_3') || 
            component.types.includes('sublocality')) {
          return component.long_name
        }
      }
    }

    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

// Function to enhance business data with missing city information
export async function enhanceBusinessWithCity(business: any) {
  if (business.city) {
    return business // Already has city
  }

  let city: string | null = null

  // Try to get city from coordinates first
  if (business.latitude && business.longitude) {
    city = await getCityFromLocation(undefined, business.latitude, business.longitude)
  }

  // Fallback to address if no coordinates or geocoding failed
  if (!city && business.addr1) {
    const fullAddress = `${business.addr1}, ${business.state || ''}`
    city = await getCityFromLocation(fullAddress)
  }

  return {
    ...business,
    city: city || business.city || 'Your Area'
  }
}