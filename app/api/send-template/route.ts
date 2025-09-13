import { NextRequest, NextResponse } from 'next/server'
import { textGrid } from '@/lib/textgrid'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    
    const {
      templateUrl,
      ownerPhone,
      firstName,
      lastName,
      email,
      phone,
      companyName,
      city,
      state,
      leadId,
      businessType,
      templateType,
      leadStatus,
      leadSource,
      slug,
      fullAddress,
      verifiedBusiness,
      rating,
      reviews
    } = payload

    if (!templateUrl || !ownerPhone) {
      return NextResponse.json(
        { success: false, error: 'Template URL and owner phone are required' },
        { status: 400 }
      )
    }

    // 1. Send SMS with template link
    const smsMessage = `Hi ${firstName || 'there'}! Thanks for speaking with us about ${businessType} services. Here's your personalized business template: ${templateUrl} - Let us know what you think!`
    
    const smsResult = await textGrid.sendSMS({
      to: ownerPhone,
      message: smsMessage
    })

    if (!smsResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to send SMS: ' + smsResult.error },
        { status: 500 }
      )
    }

    // 2. Send webhook to GoHighLevel to create/update contact
    let ghlResult = null
    try {
      const webhookUrl = 'https://services.leadconnectorhq.com/hooks/QNmjjiQF2UwCdleDDkO7/webhook-trigger/334aeeab-28ad-4d95-8eeb-153cf690d554'
      
      const ghlPayload = {
        firstName: firstName || '',
        lastName: lastName || '',
        email: email || `info@${slug}.com`,
        phone: ownerPhone,
        companyName: companyName || '',
        city: city || '',
        state: state || '',
        leadId: leadId || '',
        businessType: businessType || '',
        templateType: templateType || '',
        templateUrl: templateUrl,
        leadStatus: 'template_sent',
        leadSource: 'CRM Dashboard',
        slug: slug || '',
        fullAddress: fullAddress || '',
        verifiedBusiness: verifiedBusiness || false,
        rating: rating || '',
        reviews: reviews || '',
        dateSent: new Date().toISOString(),
        dateViewed: null,
        customFields: {
          template_url: templateUrl,
          business_slug: slug,
          template_type: templateType,
          business_rating: rating,
          business_reviews: reviews,
          verified_business: verifiedBusiness
        }
      }

      const ghlResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ghlPayload)
      })

      ghlResult = {
        success: ghlResponse.ok,
        status: ghlResponse.status,
        payload: ghlPayload
      }

      if (!ghlResponse.ok) {
        console.error('GoHighLevel webhook failed:', ghlResponse.status, ghlResponse.statusText)
      }
    } catch (error) {
      console.error('GHL webhook error:', error)
      ghlResult = { success: false, error: 'GHL webhook failed' }
    }

    // 3. Log the template send activity in Supabase
    try {
      await supabase
        .from('template_sends')
        .insert({
          lead_id: leadId,
          template_url: templateUrl,
          recipient_phone: ownerPhone,
          recipient_name: `${firstName} ${lastName}`.trim(),
          recipient_email: email,
          template_type: templateType,
          sms_message_id: smsResult.messageId,
          ghl_webhook_success: ghlResult?.success || false,
          sent_at: new Date().toISOString()
        })
    } catch (dbError) {
      console.error('Database logging error:', dbError)
      // Don't fail the request if DB logging fails
    }

    return NextResponse.json({
      success: true,
      messageId: smsResult.messageId,
      templateUrl: templateUrl,
      ghlContact: ghlResult,
      message: `Template sent successfully to ${ownerPhone}`
    })

  } catch (error) {
    console.error('Send template API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}