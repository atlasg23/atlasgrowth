import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const APIFY_TOKEN = process.env.APIFY_TOKEN || ''

export async function POST(request: NextRequest) {
  try {
    const { placeId } = await request.json()
    
    if (!placeId) {
      return NextResponse.json({ error: 'place_id is required' }, { status: 400 })
    }

    // Call Apify API
    const apifyResponse = await fetch(
      'https://api.apify.com/v2/acts/compass~google-maps-reviews-scraper/run-sync-get-dataset-items?format=json&limit=50',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${APIFY_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          placeIds: [placeId],
          maxReviews: 50,
          reviewsSort: 'newest',
          reviewsOrigin: 'google',
          personalData: false
        })
      }
    )

    if (!apifyResponse.ok) {
      throw new Error(`Apify API error: ${apifyResponse.status}`)
    }

    const reviews = await apifyResponse.json()
    
    // Filter out entries with errors (like no_reviews)
    const validReviews = reviews.filter((review: any) => !review.error && review.text)
    
    if (validReviews.length === 0) {
      return NextResponse.json({ message: 'No reviews found for this business', reviews: [] })
    }

    // Prepare reviews for database insertion
    const reviewsToInsert = validReviews.map((review: any) => ({
      place_id: placeId,
      review_text: review.text,
      reviewer_name: review.name || `Anonymous Reviewer`, // Fallback since name is often null
      review_date: review.publishedAtDate ? new Date(review.publishedAtDate).toISOString() : null,
      stars: review.stars,
      reviewer_number_of_reviews: review.reviewerNumberOfReviews || 0,
      is_local_guide: review.isLocalGuide || false,
      likes_count: review.likesCount || 0,
      response_from_owner_text: review.responseFromOwnerText,
      response_from_owner_date: review.responseFromOwnerDate ? new Date(review.responseFromOwnerDate).toISOString() : null,
      review_context: review.reviewContext || {},
      scraped_at: new Date().toISOString()
    }))

    // Insert reviews into database (on conflict do nothing to avoid duplicates)
    const { data: insertedReviews, error: insertError } = await supabase
      .from('google_reviews')
      .upsert(reviewsToInsert, { 
        onConflict: 'place_id,review_text,review_date',
        ignoreDuplicates: true 
      })
      .select()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save reviews' }, { status: 500 })
    }

    // Return the newly inserted reviews sorted by date (newest first)
    const { data: finalReviews, error: fetchError } = await supabase
      .from('google_reviews')
      .select('*')
      .eq('place_id', placeId)
      .order('review_date', { ascending: false })

    if (fetchError) {
      console.error('Database fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: `Successfully fetched ${validReviews.length} reviews`,
      reviews: finalReviews 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch reviews', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}