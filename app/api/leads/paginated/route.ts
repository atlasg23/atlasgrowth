import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Pagination params
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit
    
    // Filter params
    const businessType = searchParams.get('businessType')
    const hasPhotos = searchParams.get('hasPhotos')
    const verified = searchParams.get('verified')
    const hasValidEmail = searchParams.get('hasValidEmail')
    const hasSite = searchParams.get('hasSite')
    const hasFacebook = searchParams.get('hasFacebook')
    const minRating = searchParams.get('minRating')
    const minReviews = searchParams.get('minReviews')
    const state = searchParams.get('state')
    const search = searchParams.get('search')
    
    // Build query
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .order('import_date', { ascending: false })

    // Apply filters
    if (businessType && businessType !== 'all') {
      // Use the business type directly - no need for mapping since we're getting real types from database
      query = query.eq('business_type', businessType)
    } else {
      // Default to plumbing leads only unless searching or filtering
      if (!search) {
        query = query.eq('business_type', 'plumbing')
      }
    }
    
    if (hasPhotos === 'yes') {
      query = query.not('photo', 'is', null).neq('photo', '')
    } else if (hasPhotos === 'no') {
      query = query.or('photo.is.null,photo.eq.')
    }
    
    if (verified === 'yes') {
      query = query.eq('verified', 'true')
    } else if (verified === 'no') {
      query = query.neq('verified', 'true')
    }
    
    if (hasValidEmail === 'yes') {
      query = query.eq('email_1_emails_validator_status', 'valid')
    } else if (hasValidEmail === 'no') {
      query = query.neq('email_1_emails_validator_status', 'valid')
    }
    
    if (hasSite === 'yes') {
      query = query.not('site', 'is', null)
        .neq('site', '')
        .not('site', 'like', '%facebook.com%')
        .not('site', 'like', '%yelp.com%')
        .not('site', 'like', '%instagram.com%')
    } else if (hasSite === 'no') {
      query = query.or('site.is.null,site.eq.,site.like.%facebook.com%,site.like.%yelp.com%,site.like.%instagram.com%')
    }
    
    if (hasFacebook === 'yes') {
      query = query.not('facebook', 'is', null).neq('facebook', '')
    } else if (hasFacebook === 'no') {
      query = query.or('facebook.is.null,facebook.eq.')
    }
    
    if (minRating) {
      query = query.gte('rating', minRating)
    }
    
    if (minReviews) {
      query = query.gte('reviews', minReviews)
    }
    
    if (state && state !== 'all') {
      if (state === 'other') {
        // Exclude Louisiana, Arkansas, Alabama in both full name and abbreviation forms
        query = query.not('state', 'in', '(Louisiana,Arkansas,Alabama,LA,AR,AL)')
          .not('us_state', 'in', '(Louisiana,Arkansas,Alabama,LA,AR,AL)')
      } else {
        // Handle state matching for both full names and abbreviations
        const stateConditions = []
        if (state === 'louisiana') {
          stateConditions.push('state.eq.Louisiana', 'state.eq.LA', 'us_state.eq.Louisiana', 'us_state.eq.LA')
        } else if (state === 'arkansas') {
          stateConditions.push('state.eq.Arkansas', 'state.eq.AR', 'us_state.eq.Arkansas', 'us_state.eq.AR')
        } else if (state === 'alabama') {
          stateConditions.push('state.eq.Alabama', 'state.eq.AL', 'us_state.eq.Alabama', 'us_state.eq.AL')
        }
        
        if (stateConditions.length > 0) {
          query = query.or(stateConditions.join(','))
        }
      }
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,city.ilike.%${search}%,email_1.ilike.%${search}%`)
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1)
    
    const { data, error, count } = await query
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      leads: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: offset + limit < (count || 0),
        hasPrev: page > 1
      }
    })
    
  } catch (error) {
    console.error('Paginated leads error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}