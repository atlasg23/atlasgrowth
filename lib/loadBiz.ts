import { Business } from '@/types/business'
import fs from 'fs'
import path from 'path'

let businesses: Business[] | null = null

function loadBusinesses(): Business[] {
  if (businesses !== null) {
    return businesses
  }

  try {
    const csvPath = path.join(process.cwd(), 'data', 'businesses.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = csvContent.trim().split('\n')
    const headers = lines[0].split(',')
    
    businesses = lines.slice(1).map(line => {
      const values = line.split(',')
      const business: any = {}
      
      headers.forEach((header, index) => {
        const value = values[index]
        
        // Type conversion for specific fields
        if (header === 'latitude' || header === 'longitude') {
          business[header] = parseFloat(value)
        } else if (header === 'rating') {
          business[header] = parseFloat(value)
        } else if (header === 'reviews') {
          business[header] = parseInt(value, 10)
        } else if (header === 'logo_good') {
          business[header] = value.toLowerCase() === 'true'
        } else {
          business[header] = value
        }
      })
      
      return business as Business
    })
    
    return businesses
  } catch (error) {
    console.error('Error loading businesses:', error)
    return []
  }
}

export function getAllSlugs(): string[] {
  const businesses = loadBusinesses()
  return businesses.map(business => business.slug)
}

export function getBizBySlug(slug: string): Business | null {
  const businesses = loadBusinesses()
  return businesses.find(business => business.slug === slug) || null
}

export function getAllBusinessesByTemplate(template_key: string): Business[] {
  const businesses = loadBusinesses()
  return businesses.filter(business => business.template_key === template_key)
}
