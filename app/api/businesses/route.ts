import { NextRequest, NextResponse } from 'next/server'
import { getAllBusinessesClient } from '@/lib/loadBizClient'

export async function GET() {
  try {
    const businesses = await getAllBusinessesClient()
    
    // Filter to businesses with mobile phones for texting
    const mobileBusinesses = businesses.filter(b => 
      b.phone_carrier_type === 'mobile' && b.phone
    )

    return NextResponse.json({
      success: true,
      businesses: mobileBusinesses
    })

  } catch (error) {
    console.error('Get businesses error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load businesses' },
      { status: 500 }
    )
  }
}