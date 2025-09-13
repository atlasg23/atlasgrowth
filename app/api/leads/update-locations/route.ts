import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { reverseGeocode } from '@/lib/googleMaps'

export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database access not configured' },
        { status: 500 }
      )
    }
    
    // Find leads with lat/lng but missing city or state
    const { data: leadsToUpdate } = await supabaseAdmin
      .from('leads')
      .select('id, name, latitude, longitude, city, state')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .or('city.is.null,state.is.null')
      .limit(50) // Process in batches to avoid API limits
    
    if (!leadsToUpdate || leadsToUpdate.length === 0) {
      return NextResponse.json({
        message: 'No leads found that need location updates',
        updated: 0
      })
    }
    
    let updated = 0
    let errors = 0
    
    for (const lead of leadsToUpdate) {
      try {
        // Add small delay to respect Google API rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const locationData = await reverseGeocode(lead.latitude, lead.longitude)
        
        if (locationData && (locationData.city || locationData.state)) {
          // Only update if we don't have the data or if we got better data
          const updateData: any = {}
          
          if (!lead.city && locationData.city) {
            updateData.city = locationData.city
          }
          
          if (!lead.state && locationData.state) {
            updateData.state = locationData.state
          }
          
          if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabaseAdmin
              .from('leads')
              .update(updateData)
              .eq('id', lead.id)
            
            if (updateError) {
              console.error(`Failed to update lead ${lead.id}:`, updateError)
              errors++
            } else {
              console.log(`Updated ${lead.name}: ${JSON.stringify(updateData)}`)
              updated++
            }
          }
        }
      } catch (error) {
        console.error(`Error processing lead ${lead.id}:`, error)
        errors++
      }
    }
    
    return NextResponse.json({
      message: `Location update completed`,
      processed: leadsToUpdate.length,
      updated,
      errors,
      remaining: `Check for more leads that need updates`
    })
    
  } catch (error) {
    console.error('Location update error:', error)
    return NextResponse.json(
      { error: 'Failed to update locations' },
      { status: 500 }
    )
  }
}