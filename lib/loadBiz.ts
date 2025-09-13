import { Business } from '@/types/business'
import { supabase } from './supabase'

// Simple cache - clear it for debugging
let businessCache: Business[] | null = null

function mapToTemplate(niche?: string): string {
  if (!niche) return 'hvac'
  const n = niche.toLowerCase()
  if (n.includes('plumb') || n.includes('drainage') || n.includes('fontanero') || n.includes('bathroom remodel')) {
    return 'plumbing'
  }
  if (n.includes('electric')) {
    return 'hvac' // Use HVAC template for electricians for now
  }
  return 'hvac' // default to hvac
}

function processBusiness(raw: any): Business {
  const template = mapToTemplate(raw.niche)
  
  // Default color schemes by template
  const defaultColors = {
    plumbing: { primary: '#0EA5E9', secondary: '#F59E0B' },
    hvac: { primary: '#DC2626', secondary: '#059669' }
  }
  
  const colors = defaultColors[template as keyof typeof defaultColors] || defaultColors.plumbing
  
  return {
    ...raw,
    template_key: template,
    // Use database colors if available, otherwise use defaults
    primary_color: raw.primary_color || colors.primary,
    secondary_color: raw.secondary_color || colors.secondary
  }
}

export async function getAllBusinesses(): Promise<Business[]> {
  if (businessCache) return businessCache

  try {
    const { data, error } = await supabase
      .from('biz')
      .select('*')
      .limit(2000) // Increase limit to get more records
    
    if (error) throw error
    
    businessCache = (data || []).map(processBusiness)
    return businessCache
  } catch (error) {
    console.error('Error loading businesses:', error)
    return []
  }
}

export async function getBizBySlug(slug: string): Promise<Business | null> {
  try {
    // Use direct query for better performance and to avoid pagination limits
    const { data, error } = await supabase
      .from('biz')
      .select('*')
      .eq('slug', slug)
      .single()
    
    if (!error && data) {
      return processBusiness(data)
    }
    
    return null
    
  } catch (error) {
    console.error('Error in getBizBySlug:', error)
    return null
  }
}

export async function getAllSlugs(): Promise<string[]> {
  const businesses = await getAllBusinesses()
  return businesses.map(b => b.slug)
}