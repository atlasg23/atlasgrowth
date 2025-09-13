import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { 
      phone, 
      businessName, 
      businessSlug,
      templateType,
      leadId 
    } = await request.json()

    if (!phone || !businessSlug) {
      return NextResponse.json(
        { error: 'Phone and business slug are required' },
        { status: 400 }
      )
    }

    // Format phone number (remove non-digits and add +1 if needed)
    const cleanPhone = phone.replace(/\D/g, '')
    const formattedPhone = cleanPhone.startsWith('1') 
      ? `+${cleanPhone}` 
      : `+1${cleanPhone}`

    // Build template URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'
    const templateUrl = `${baseUrl}/${templateType || 'plumbing-pro'}/${businessSlug}`
    
    // Create SMS message
    const message = `Hi ${businessName || 'there'}! Here's the custom website template I put together for your business: ${templateUrl}`

    // TextGrid uses Twilio-compatible API
    const accountSid = process.env.TEXTGRID_ACCOUNT_SID
    const authToken = process.env.TEXTGRID_AUTH_TOKEN
    const fromPhone = process.env.TEXTGRID_PHONE_2
    
    // Create base64 auth header
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
    
    // Send via TextGrid (Twilio-compatible endpoint)
    const textgridResponse = await fetch(
      `https://api.textgrid.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          From: fromPhone!,
          To: formattedPhone,
          Body: message
        })
      }
    )

    if (!textgridResponse.ok) {
      const error = await textgridResponse.text()
      console.error('TextGrid error:', error)
      throw new Error(`TextGrid API failed: ${error}`)
    }

    const result = await textgridResponse.json()

    // Log template send in database
    if (leadId) {
      await supabase
        .from('template_sends')
        .insert({
          lead_id: leadId,
          business_slug: businessSlug,
          template_type: templateType,
          phone_number: formattedPhone,
          template_url: templateUrl,
          sms_message_id: result.sid,
          sent_at: new Date().toISOString()
        })
    }

    console.log(`Template SMS sent to ${formattedPhone} for ${businessName}`)

    return NextResponse.json({
      success: true,
      message: 'Template link sent successfully',
      details: {
        phone: formattedPhone,
        templateUrl,
        textgridMessageId: result.sid
      }
    })

  } catch (error) {
    console.error('Send template SMS error:', error)
    return NextResponse.json(
      { error: `Failed to send SMS: ${(error as Error).message}` },
      { status: 500 }
    )
  }
}