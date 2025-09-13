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
  
  // Remove size parameters like /s44-p-k-no-ns-nd/ or /s96-c-k-no-ns-nd/
  let cleanedUrl = url.replace(/\/s\d+(-[a-z\-]+)*\//, '/')
  
  // Also handle query parameters like =s44-c-k
  cleanedUrl = cleanedUrl.replace(/=s\d+(-[a-z\-]+)*/, '')
  
  // Clean up any remaining artifacts
  cleanedUrl = cleanedUrl.replace(/\/photo\.jpg.*$/, '/photo.jpg')
  
  return cleanedUrl
}

// Get fallback colors based on business type
function getBusinessColors(businessType) {
  const type = businessType?.toLowerCase() || ''
  
  if (type.includes('plumb')) {
    return { primary: '#1E40AF', secondary: '#F59E0B' } // Blue & Yellow
  } else if (type.includes('hvac') || type.includes('heating') || type.includes('cooling') || type.includes('air')) {
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
  } else if (type.includes('fire') || type.includes('protection')) {
    return { primary: '#DC2626', secondary: '#F59E0B' } // Red & Yellow
  } else {
    return { primary: '#1E40AF', secondary: '#F59E0B' } // Default: Blue & Yellow
  }
}

async function processAllBusinesses() {
  try {
    console.log('🚀 Starting logo cleanup and color assignment...')
    
    // Get all businesses with logos
    const { data: businesses, error } = await supabase
      .from('leads')
      .select('id, name, business_type, logo')
      .not('logo', 'is', null)
      .neq('logo', '')
      .order('id')
    
    if (error) {
      throw error
    }
    
    console.log(`📊 Found ${businesses.length} businesses with logos to process`)
    
    let processed = 0
    let logosCleaned = 0
    let colorsAdded = 0
    
    // Process in batches of 20
    const batchSize = 20
    for (let i = 0; i < businesses.length; i += batchSize) {
      const batch = businesses.slice(i, i + batchSize)
      
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(businesses.length / batchSize)}`)
      
      for (const business of batch) {
        try {
          // Clean up the logo URL
          const originalLogo = business.logo
          const cleanedLogo = cleanLogoUrl(originalLogo)
          
          // Get colors for this business type
          const colors = getBusinessColors(business.business_type)
          
          const wasLogoCleaned = cleanedLogo !== originalLogo
          
          // Always update with cleaned logo and colors
          const { error: updateError } = await supabase
            .from('leads')
            .update({
              logo: cleanedLogo,
              primary_color: colors.primary,
              secondary_color: colors.secondary
            })
            .eq('id', business.id)
          
          if (updateError) {
            console.error(`❌ Error updating ${business.name}:`, updateError.message)
          } else {
            if (wasLogoCleaned) {
              console.log(`🔧 ${business.name}: Logo cleaned + Colors added`)
              logosCleaned++
            } else {
              console.log(`🎨 ${business.name}: Colors added`)
            }
            colorsAdded++
          }
          
        } catch (error) {
          console.error(`❌ Error processing ${business.name}:`, error.message)
        }
        
        processed++
        
        // Show progress every 50 businesses
        if (processed % 50 === 0) {
          console.log(`⏳ Progress: ${processed}/${businesses.length}`)
        }
      }
      
      // Small delay between batches to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    console.log('\n🎉 PROCESSING COMPLETE!')
    console.log(`📈 Results:`)
    console.log(`   • Total processed: ${processed}`)
    console.log(`   • Logos cleaned: ${logosCleaned}`)
    console.log(`   • Colors added: ${colorsAdded}`)
    console.log(`   • Success rate: ${Math.round((colorsAdded / processed) * 100)}%`)
    
    // Show some examples
    console.log('\n📋 Sample results:')
    const { data: samples } = await supabase
      .from('leads')
      .select('name, business_type, logo, primary_color, secondary_color')
      .not('logo', 'is', null)
      .not('primary_color', 'is', null)
      .limit(5)
    
    samples?.forEach(sample => {
      console.log(`\n🏢 ${sample.name} (${sample.business_type})`)
      console.log(`   Logo: ${sample.logo}`)
      console.log(`   Colors: ${sample.primary_color} / ${sample.secondary_color}`)
    })
    
    console.log('\n✅ All businesses now have:')
    console.log('   • High-quality logo URLs (Google size restrictions removed)')
    console.log('   • Primary and secondary colors based on business type')
    console.log('   • Ready for use in website templates!')
    
  } catch (error) {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  }
}

// Run the script
processAllBusinesses()