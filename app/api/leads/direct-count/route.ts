import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database admin access not configured' },
        { status: 500 }
      )
    }
    
    // Get total count with admin privileges
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      return NextResponse.json({ error: 'Count error: ' + countError.message }, { status: 500 })
    }
    
    // Get business type breakdown with admin privileges
    const { data: businessTypeData, error: businessError } = await supabaseAdmin
      .from('leads')
      .select('business_type')
      .limit(10000) // High limit to check if this is the issue
    
    if (businessError) {
      return NextResponse.json({ error: 'Business type error: ' + businessError.message }, { status: 500 })
    }
    
    // Count business types
    const businessTypeCounts: Record<string, number> = {}
    businessTypeData?.forEach(item => {
      const type = item.business_type || 'Unknown'
      businessTypeCounts[type] = (businessTypeCounts[type] || 0) + 1
    })
    
    // Get carrier type breakdown
    const { data: carrierData, error: carrierError } = await supabaseAdmin
      .from('leads')
      .select('phone_phones_enricher_carrier_type')
      .limit(10000)
    
    if (carrierError) {
      return NextResponse.json({ error: 'Carrier error: ' + carrierError.message }, { status: 500 })
    }
    
    const carrierCounts: Record<string, number> = {}
    carrierData?.forEach(item => {
      const carrier = item.phone_phones_enricher_carrier_type || 'unknown'
      carrierCounts[carrier] = (carrierCounts[carrier] || 0) + 1
    })
    
    // Check filtered count (excluding landlines)
    const { count: filteredCount, error: filteredError } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .not('phone_phones_enricher_carrier_type', 'eq', 'landline')
      .not('phone_phones_enricher_carrier_type', 'eq', 'fixed_line')
      .not('phone_phones_enricher_carrier_type', 'eq', 'fixed line')
    
    return NextResponse.json({
      totalLeads: totalCount,
      filteredLeads: filteredCount,
      businessTypesFound: Object.keys(businessTypeCounts).length,
      businessTypeBreakdown: Object.entries(businessTypeCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20),
      carrierBreakdown: carrierCounts,
      dataFetched: businessTypeData?.length || 0,
      errors: {
        countError: (countError as any)?.message,
        businessError: (businessError as any)?.message,
        carrierError: (carrierError as any)?.message,
        filteredError: (filteredError as any)?.message
      }
    })
    
  } catch (error) {
    console.error('Direct count endpoint error:', error)
    return NextResponse.json(
      { error: 'Failed to get direct count: ' + (error as Error).message },
      { status: 500 }
    )
  }
}