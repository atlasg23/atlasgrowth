import { NextRequest, NextResponse } from 'next/server'
import { TextGridAPI } from '@/lib/textgrid'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-textgrid-signature') || ''
    
    // Verify webhook signature
    const isValid = TextGridAPI.verifyWebhook(
      signature,
      body,
      process.env.TEXTGRID_WEBHOOK_SECRET!
    )

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    const webhookData = JSON.parse(body)
    
    // Handle incoming message
    if (webhookData.type === 'message.received') {
      const message = webhookData.data

      // Store incoming message in database
      try {
        await pool.query(`
          INSERT INTO messages (
            message_id, phone_number, direction, body, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())
          ON CONFLICT (message_id) DO UPDATE SET
            body = $4,
            updated_at = NOW()
        `, [
          message.id || message.message_id,
          message.from,
          'inbound',
          message.body,
          'received'
        ])

        console.log(`📩 Received SMS from ${message.from}: ${message.body}`)
      } catch (dbError) {
        console.error('Failed to store incoming message:', dbError)
      }
    }

    // Handle delivery status updates
    if (webhookData.type === 'message.status') {
      const status = webhookData.data
      
      try {
        await pool.query(`
          UPDATE messages 
          SET status = $1, updated_at = NOW()
          WHERE message_id = $2
        `, [status.status, status.message_id])

        console.log(`📊 Message ${status.message_id} status: ${status.status}`)
      } catch (dbError) {
        console.error('Failed to update message status:', dbError)
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('TextGrid webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}