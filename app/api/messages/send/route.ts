import { NextRequest, NextResponse } from 'next/server'
import { textGrid } from '@/lib/textgrid'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
})

export async function POST(request: NextRequest) {
  try {
    const { to, message, business } = await request.json()

    if (!to || !message) {
      return NextResponse.json(
        { success: false, error: 'Phone number and message are required' },
        { status: 400 }
      )
    }

    // 1. Send SMS via TextGrid
    const smsResult = await textGrid.sendSMS({
      to,
      message
    })

    if (!smsResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to send SMS: ' + smsResult.error },
        { status: 500 }
      )
    }

    // 2. Create/Update GHL Contact if business data provided
    let ghlResult = null
    if (business) {
      try {
        // Send webhook to GHL to create/update contact
        const webhookUrl = 'https://services.leadconnectorhq.com/hooks/R4NP0dhyOcoT5XRy1IOe/webhook-trigger/6c47723e-7646-4834-b68a-53aa19a6b701'
        
        const ghlPayload = {
          name: business.name,
          phone: to,
          demoUrl: business.demoUrl,
          experimentId: business.experimentId,
          source: 'SMS_OUTREACH',
          status: 'contacted'
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
          status: ghlResponse.status
        }
      } catch (error) {
        console.error('GHL webhook error:', error)
        ghlResult = { success: false, error: 'GHL webhook failed' }
      }
    }

    // 3. Store message in database for conversation tracking
    try {
      await pool.query(`
        INSERT INTO messages (
          message_id, phone_number, direction, body, status, 
          business_name, demo_url, experiment_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (message_id) DO UPDATE SET
          status = $5,
          updated_at = NOW()
      `, [
        smsResult.messageId,
        to,
        'outbound',
        message,
        'sent',
        business?.name || null,
        business?.demoUrl || null,
        business?.experimentId || null
      ])
    } catch (dbError) {
      console.error('Database storage error:', dbError)
      // Don't fail the request if DB storage fails
    }

    return NextResponse.json({
      success: true,
      messageId: smsResult.messageId,
      ghlContact: ghlResult
    })

  } catch (error) {
    console.error('Send message API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}