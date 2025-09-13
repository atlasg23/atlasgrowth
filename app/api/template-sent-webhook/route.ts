import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    
    // Send to ORIGINAL GoHighLevel webhook for contact creation
    const webhookUrl = 'https://services.leadconnectorhq.com/hooks/QNmjjiQF2UwCdleDDkO7/webhook-trigger/334aeeab-28ad-4d95-8eeb-153cf690d554'
    
    // Simple payload - just contact info
    const ghlPayload = {
      business_name: payload.business_name,
      business_phone: payload.business_phone,
      owner_email: payload.business_email || '',
      template_sent: true,
      template_type: payload.template_type,
      notes: `Template sent: ${payload.template_url}`
    }
    
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ghlPayload)
      })
      
      console.log('📤 Template sent webhook fired to GHL:', ghlPayload)
    } catch (error) {
      console.error('GHL webhook failed:', error)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Template sent webhook error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}