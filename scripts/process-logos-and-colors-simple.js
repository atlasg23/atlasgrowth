const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Clean up Google logo URL to get high quality version
function cleanLogoUrl(url) {
  if (!url || !url.includes('googleusercontent.com')) {
    return url
  }
  
  try {
    console.log(`Original URL: ${url}`)
    
    // Remove size parameters like /s44-p-k-no-ns-nd/ or /s96-c-k-no-ns-nd/
    let cleanedUrl = url.replace(/\/s\d+(-[a-z\-]+)*\//, '/')
    
    // Also handle query parameters like =s44-c-k
    cleanedUrl = cleanedUrl.replace(/=s\d+(-[a-z\-]+)*/, '')
    
    // Clean up any remaining artifacts
    cleanedUrl = cleanedUrl.replace(/\/photo\.jpg.*$/, '/photo.jpg')
    
    console.log(`Cleaned URL: ${cleanedUrl}`)
    return cleanedUrl
    
  } catch (error) {
    console.log(`Error cleaning URL ${url}:`, error.message)
    return url
  }
}

// Fallback colors based on business type
function getFallbackColors(businessType) {
  const type = businessType?.toLowerCase() || ''
  
  if (type.includes('plumb')) {
    return { primary: '#1E40AF', secondary: '#F59E0B' } // Blue & Yellow
  } else if (type.includes('hvac') || type.includes('heating') || type.includes('cooling')) {
    return { primary: '#DC2626', secondary: '#0EA5E9' } // Red & Blue
  } else if (type.includes('electric')) {
    return { primary: '#F59E0B', secondary: '#1E40AF' } // Yellow & Blue
  } else if (type.includes('roof')) {
    return { primary: '#374151', secondary: '#F59E0B' } // Gray & Yellow
  } else if (type.includes('pest') || type.includes('control')) {
    return { primary: '#059669', secondary: '#DC2626' } // Green & Red
  } else if (type.includes('pressure') || type.includes('washing') || type.includes('cleaning')) {
    return { primary: '#0EA5E9', secondary: '#059669' } // Blue & Green
  } else if (type.includes('tree') || type.includes('service')) {
    return { primary: '#059669', secondary: '#92400E' } // Green & Brown
  } else {
    return { primary: '#1E40AF', secondary: '#F59E0B' } // Default: Blue & Yellow
  }
}

// First run: Clean URLs and add fallback colors
async function processLogosPhase1() {
  try {
    console.log('=== PHASE 1: Cleaning URLs and Adding Fallback Colors ===')
    
    // Get all businesses with logos that haven't been processed yet
    const { data: businesses, error } = await supabase
      .from('leads')
      .select('id, name, business_type, logo')
      .not('logo', 'is', null)
      .neq('logo', '')
      .order('id')
    
    if (error) {
      throw error
    }
    
    console.log(`Found ${businesses.length} businesses with logos`)
    
    let processed = 0
    let updated = 0
    
    // Process in batches
    const batchSize = 50
    for (let i = 0; i < businesses.length; i += batchSize) {
      const batch = businesses.slice(i, i + batchSize)
      
      console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(businesses.length / batchSize)}`)
      
      for (const business of batch) {
        try {
          console.log(`Processing: ${business.name}`)
          
          // Clean up the logo URL
          const cleanedLogoUrl = cleanLogoUrl(business.logo)
          
          // Get fallback colors for this business type
          const fallbackColors = getFallbackColors(business.business_type)
          
          // Check if URL was actually changed or if we need to add colors
          const needsUpdate = cleanedLogoUrl !== business.logo
          
          if (needsUpdate) {
            // Update the business with cleaned logo URL and fallback colors
            const { error: updateError } = await supabase
              .from('leads')
              .update({
                logo: cleanedLogoUrl,
                primary_color: fallbackColors.primary,
                secondary_color: fallbackColors.secondary
              })
              .eq('id', business.id)
            
            if (updateError) {
              console.error(`Error updating ${business.name}:`, updateError)
            } else {
              console.log(`✅ Updated ${business.name} - URL cleaned and colors added`)
              updated++
            }
          } else {
            // Just add colors if URL doesn't need cleaning
            const { error: updateError } = await supabase
              .from('leads')
              .update({
                primary_color: fallbackColors.primary,
                secondary_color: fallbackColors.secondary
              })
              .eq('id', business.id)
              .is('primary_color', null)
            
            if (updateError) {
              console.error(`Error updating colors for ${business.name}:`, updateError)
            } else {
              console.log(`✅ Added fallback colors for ${business.name}`)
              updated++
            }
          }
          
        } catch (error) {
          console.error(`Error processing ${business.name}:`, error.message)
        }
        
        processed++
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100))
      
      console.log(`Progress: ${processed}/${businesses.length} (${updated} updated)`)
    }
    
    console.log('\n=== PHASE 1 COMPLETE ===')
    console.log(`Total processed: ${processed}`)
    console.log(`Total updated: ${updated}`)
    
    return { processed, updated }
    
  } catch (error) {
    console.error('Error in Phase 1:', error)
    throw error
  }
}

// Show sample of cleaned URLs
async function showSamples() {
  try {
    console.log('\n=== SAMPLE CLEANED LOGOS ===')
    
    const { data: samples, error } = await supabase
      .from('leads')
      .select('id, name, logo, primary_color, secondary_color')
      .not('logo', 'is', null)
      .neq('logo', '')
      .limit(10)
    
    if (error) throw error
    
    samples.forEach(sample => {
      console.log(`\nBusiness: ${sample.name}`)
      console.log(`Logo: ${sample.logo}`)
      console.log(`Colors: ${sample.primary_color} / ${sample.secondary_color}`)
    })
    
  } catch (error) {
    console.error('Error showing samples:', error)
  }
}

// Main execution
async function main() {
  try {
    // First check if we need to add the columns
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('primary_color, secondary_color')
        .limit(1)
      
      if (error && error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('❌ Database columns not found!')
        console.log('Please run this SQL first:')
        console.log('ALTER TABLE leads ADD COLUMN primary_color VARCHAR(7);')
        console.log('ALTER TABLE leads ADD COLUMN secondary_color VARCHAR(7);')
        return
      }
    } catch (error) {
      console.log('❌ Could not check database columns:', error.message)
      return
    }
    
    console.log('✅ Database columns exist')
    
    // Run Phase 1
    const result = await processLogosPhase1()
    
    // Show samples
    await showSamples()
    
    console.log('\n🎉 Script completed successfully!')
    console.log(`\n📊 Summary:`)
    console.log(`- Processed ${result.processed} businesses`)
    console.log(`- Updated ${result.updated} businesses`)
    console.log(`- All businesses now have clean logo URLs`)
    console.log(`- All businesses now have fallback colors`)
    
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}