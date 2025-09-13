import { NextRequest, NextResponse } from 'next/server'
import { textGrid } from '@/lib/textgrid'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
})

export async function GET() {
  try {
    // Get conversations from TextGrid API
    const conversations = await textGrid.getConversations()

    // Enrich conversations with business data from our database
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        try {
          // Look up business info for this phone number
          const businessResult = await pool.query(`
            SELECT DISTINCT ON (phone) 
              name, niche, city, state, demourl1, demoURL1, experimentid, experimentId
            FROM biz 
            WHERE phone = $1
            ORDER BY phone, id DESC
            LIMIT 1
          `, [conv.phoneNumber])

          const business = businessResult.rows[0]

          return {
            ...conv,
            contact: business ? {
              name: business.name,
              business: {
                name: business.name,
                niche: business.niche,
                city: business.city,
                state: business.state,
                demourl1: business.demourl1 || business.demoURL1,
                experimentid: business.experimentid || business.experimentId
              }
            } : undefined
          }
        } catch (error) {
          console.error('Error enriching conversation:', error)
          return conv
        }
      })
    )

    return NextResponse.json({
      success: true,
      conversations: enrichedConversations
    })

  } catch (error) {
    console.error('Get conversations error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load conversations' },
      { status: 500 }
    )
  }
}