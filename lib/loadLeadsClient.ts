import { Lead } from '@/types/lead'
import { supabase } from './supabase'

export async function getAllLeadsClient(): Promise<Lead[]> {
  try {
    // Fetch data in batches to avoid limits
    let allLeads: Lead[] = []
    let from = 0
    const batchSize = 1000
    let hasMore = true
    
    while (hasMore) {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('import_date', { ascending: false })
        .range(from, from + batchSize - 1)
      
      if (error) throw error
      
      if (data && data.length > 0) {
        allLeads = allLeads.concat(data)
        from += batchSize
        hasMore = data.length === batchSize // Continue if we got a full batch
      } else {
        hasMore = false
      }
      
      // Safety break for very large datasets
      if (allLeads.length > 25000) {
        console.log('Reached safety limit of 25,000 leads')
        break
      }
    }
    
    console.log(`Loaded ${allLeads.length} total leads`)
    return allLeads
  } catch (error) {
    console.error('Error loading leads:', error)
    return []
  }
}

export async function getLeadsWithFilters(filters: {
  businessType?: string
  carrierType?: string
  hasPhotos?: boolean
  verified?: boolean
  hasValidEmail?: boolean
  hasSite?: boolean
  hasFacebook?: boolean
  minRating?: number
  minReviews?: number
  state?: string
  city?: string
}): Promise<Lead[]> {
  try {
    let query = supabase
      .from('leads')
      .select('*')
      .order('import_date', { ascending: false })

    // Apply filters
    if (filters.businessType && filters.businessType !== 'all') {
      query = query.eq('business_type', filters.businessType)
    }
    
    if (filters.carrierType && filters.carrierType !== 'all') {
      query = query.eq('phone_phones_enricher_carrier_type', filters.carrierType)
    }
    
    if (filters.hasPhotos === true) {
      query = query.not('photo', 'is', null)
    } else if (filters.hasPhotos === false) {
      query = query.is('photo', null)
    }
    
    if (filters.verified === true) {
      query = query.eq('verified', 'true')
    } else if (filters.verified === false) {
      query = query.neq('verified', 'true')
    }
    
    if (filters.hasValidEmail === true) {
      query = query.eq('email_1_emails_validator_status', 'valid')
    } else if (filters.hasValidEmail === false) {
      query = query.neq('email_1_emails_validator_status', 'valid')
    }
    
    if (filters.hasSite === true) {
      query = query.not('site', 'is', null)
        .neq('site', '')
        .not('site', 'like', '%facebook.com%')
        .not('site', 'like', '%yelp.com%')
        .not('site', 'like', '%instagram.com%')
    } else if (filters.hasSite === false) {
      query = query.or('site.is.null,site.eq.,site.like.%facebook.com%,site.like.%yelp.com%,site.like.%instagram.com%')
    }
    
    if (filters.hasFacebook === true) {
      query = query.not('facebook', 'is', null)
    } else if (filters.hasFacebook === false) {
      query = query.is('facebook', null)
    }
    
    if (filters.minRating) {
      query = query.gte('rating', filters.minRating.toString())
    }
    
    if (filters.minReviews) {
      query = query.gte('reviews', filters.minReviews.toString())
    }
    
    if (filters.state) {
      query = query.eq('state', filters.state)
    }
    
    if (filters.city) {
      query = query.eq('city', filters.city)
    }

    const { data, error } = await query
    
    if (error) throw error
    
    return data || []
  } catch (error) {
    console.error('Error loading filtered leads:', error)
    return []
  }
}