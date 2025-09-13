import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    
    const {
      business_name,
      business_phone,
      owner_name,
      owner_email,
      notes
    } = payload

    if (!business_name || !business_phone) {
      return NextResponse.json(
        { success: false, error: 'Business name and phone are required' },
        { status: 400 }
      )
    }

    // Send webhook to GoHighLevel only
    let ghlResult = null
    try {
      const webhookUrl = 'https://services.leadconnectorhq.com/hooks/QNmjjiQF2UwCdleDDkO7/webhook-trigger/334aeeab-28ad-4d95-8eeb-153cf690d554'
      
      const ghlPayload = {
        business_name: business_name,
        business_phone: business_phone,
        owner_name: owner_name || '',
        owner_email: owner_email || '',
        notes: notes || ''
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
        const errorText = await ghlResponse.text()
        console.error('GoHighLevel webhook failed:', ghlResponse.status, errorText)
        throw new Error(`GoHighLevel webhook failed: ${ghlResponse.status}`)
      }
    } catch (error) {
      console.error('GHL webhook error:', error)
      return NextResponse.json(
        { success: false, error: 'GoHighLevel webhook failed: ' + (error as any).message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      ghlContact: ghlResult,
      message: `Contact for ${business_name} synced to GoHighLevel successfully`
    })

  } catch (error) {
    console.error('Send to GHL API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}