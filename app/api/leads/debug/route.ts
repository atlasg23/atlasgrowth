import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database access not configured' },
        { status: 500 }
      )
    }
    
    // Get total count
    const { count: totalCount } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })
    
    // Get carrier type breakdown
    const { data: carrierData } = await supabaseAdmin
      .from('leads')
      .select('phone_phones_enricher_carrier_type')
      .not('phone_phones_enricher_carrier_type', 'is', null)
    
    // Get business type breakdown
    const { data: businessTypeData } = await supabaseAdmin
      .from('leads')
      .select('business_type')
      .not('business_type', 'is', null)
    
    // Count carrier types
    const carrierCounts: Record<string, number> = {}
    carrierData?.forEach(item => {
      const carrier = item.phone_phones_enricher_carrier_type
      carrierCounts[carrier] = (carrierCounts[carrier] || 0) + 1
    })
    
    // Count business types
    const businessTypeCounts: Record<string, number> = {}
    businessTypeData?.forEach(item => {
      const type = item.business_type
      businessTypeCounts[type] = (businessTypeCounts[type] || 0) + 1
    })
    
    // Count filtered leads (excluding landline/fixed line)
    const { count: filteredCount } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .or('phone_phones_enricher_carrier_type.is.null,phone_phones_enricher_carrier_type.neq.landline,phone_phones_enricher_carrier_type.neq.fixed_line,phone_phones_enricher_carrier_type.neq.fixed line')
    
    return NextResponse.json({
      totalLeads: totalCount,
      filteredLeads: filteredCount,
      carrierBreakdown: carrierCounts,
      businessTypeBreakdown: businessTypeCounts,
      topBusinessTypes: Object.entries(businessTypeCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
    })
    
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: 'Failed to get debug info' },
      { status: 500 }
    )
  }
}