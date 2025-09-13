import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    console.log('📥 Track view received:', payload)
    
    // Get real IP from headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = forwarded ? forwarded.split(',')[0] :
                   request.headers.get('x-real-ip') ||
                   '0.0.0.0'
    
    const {
      business_slug,
      template_type,
      user_agent,
      referrer,
      session_id,
      page_loaded_at
    } = payload

    if (!business_slug || !template_type) {
      return NextResponse.json(
        { success: false, error: 'Business slug and template type are required' },
        { status: 400 }
      )
    }

    // Check if this is a unique visitor (no view from this IP in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentView } = await supabase
      .from('template_views')
      .select('id')
      .eq('business_slug', business_slug)
      .eq('visitor_ip', realIp)
      .gte('viewed_at', oneHourAgo)
      .single()
    
    const isUniqueVisitor = !recentView
    
    // Record the view in template_views table
    const { data: viewData, error: insertError } = await supabase
      .from('template_views')
      .insert({
        business_slug,
        template_type,
        visitor_ip: realIp,
        user_agent: user_agent || '',
        referrer: referrer || '',
        session_id: session_id || null,
        is_unique: isUniqueVisitor,
        viewed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error recording template view:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to record view' },
        { status: 500 }
      )
    }

    // Update call logs to mark template as viewed if there's a matching sent template
    const { error: updateError } = await supabase
      .from('call_logs')
      .update({
        template_viewed: true,
        template_viewed_date: new Date().toISOString()
      })
      .eq('business_id', business_slug) // Assuming business_id matches slug
      .eq('template_sent', true)
      .is('template_viewed_date', null) // Only update first view

    if (updateError) {
      console.error('Error updating call log:', updateError)
    }

    // Find business in leads table by clean slug
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .select('name, phone, email_1')
      .eq('slug', business_slug)
      .single()
    
    console.log('🔍 Lead lookup result:', { found: !!leadData, error: leadError?.message })
    
    // Send to NEW webhook for template view tracking
    if (leadData && leadData.phone) {
      try {
        const webhookUrl = 'https://services.leadconnectorhq.com/hooks/QNmjjiQF2UwCdleDDkO7/webhook-trigger/908ee7d4-f409-48a4-938d-8567282e87b3'
        
        // Simple payload with just what GHL needs
        const ghlPayload = {
          business_name: leadData.name,
          business_phone: leadData.phone,
          business_email: leadData.email_1 || '',
          template_viewed: true,
          viewed_at: new Date().toISOString()
        }
        
        console.log('🚀 Sending to GHL webhook:', ghlPayload)

        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ghlPayload)
        })
        
        console.log('✅ GHL webhook response:', webhookResponse.status, webhookResponse.ok)
        
        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text()
          console.error('❌ GHL webhook error response:', errorText)
        }
      } catch (ghlError) {
        console.error('❌ GoHighLevel webhook failed:', ghlError)
        // Don't fail the request if webhook fails
      }
    } else {
      console.log('⚠️ No lead data found or missing phone, skipping GHL webhook')
    }

    return NextResponse.json({
      success: true,
      message: 'Template view recorded successfully',
      view_id: viewData?.id,
      is_unique: isUniqueVisitor
    })

  } catch (error) {
    console.error('Template view tracking error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}