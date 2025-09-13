import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { view_id, duration_seconds, interactions } = await request.json()

    if (!view_id || !duration_seconds) {
      return NextResponse.json(
        { success: false, error: 'View ID and duration are required' },
        { status: 400 }
      )
    }

    // Update the view record with duration
    const { error } = await supabase
      .from('template_views')
      .update({
        duration_seconds,
        interactions: interactions || 0,
        left_at: new Date().toISOString()
      })
      .eq('id', view_id)

    if (error) {
      console.error('Error updating view duration:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update duration' },
        { status: 500 }
      )
    }

    // Send notification if they viewed for more than 30 seconds
    if (duration_seconds > 30) {
      const { data: viewData } = await supabase
        .from('template_views')
        .select('business_slug, template_type')
        .eq('id', view_id)
        .single()

      if (viewData) {
        // Get business details for context
        const { data: leadData } = await supabase
          .from('leads')
          .select('name, phone, email_1')
          .or(`slug.eq.${viewData.business_slug},site.eq.${viewData.business_slug}`)
          .single()
        
        // Don't send duration updates to GHL - keep it simple
        // Just log it locally for our analytics
        console.log(`📊 Template engagement: ${leadData?.name} spent ${duration_seconds}s on template`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Duration updated'
    })

  } catch (error) {
    console.error('Track duration error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}