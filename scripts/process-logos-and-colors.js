const { createClient } = require('@supabase/supabase-js')
const Vibrant = require('node-vibrant/node')
const https = require('https')
const http = require('http')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Color utility functions
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function getContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  
  if (!rgb1 || !rgb2) return 0
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)
  
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  
  return (brightest + 0.05) / (darkest + 0.05)
}

function isColorTooLight(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return false
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b)
  return luminance > 0.8 // Too light if luminance > 80%
}

function isColorTooDark(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return false
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b)
  return luminance < 0.1 // Too dark if luminance < 10%
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

// Clean up Google logo URL to get high quality version
function cleanLogoUrl(url) {
  if (!url || !url.includes('googleusercontent.com')) {
    return url
  }
  
  try {
    // Remove size parameters and quality restrictions
    // Pattern: /s44-p-k-no-ns-nd/ or similar size restrictions
    const cleanedUrl = url.replace(/\/s\d+(-[a-z\-]+)*\//, '/')
    
    // Also handle other Google Photos URL patterns
    return cleanedUrl
      .replace(/=s\d+(-[a-z\-]+)*/, '') // Remove =s44-c-k parameters
      .replace(/\/photo\.jpg.*$/, '/photo.jpg') // Clean up photo.jpg endings
    
  } catch (error) {
    console.log(`Error cleaning URL ${url}:`, error.message)
    return url
  }
}

// Simple HTTP fetch function
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    const request = lib.get(url, (response) => {
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(new Error('Failed to load page, status code: ' + response.statusCode))
      } else {
        resolve(response)
      }
    })
    request.on('error', (err) => reject(err))
  })
}

// Extract colors from image URL
async function extractColorsFromImage(imageUrl) {
  try {
    console.log(`Extracting colors from: ${imageUrl}`)
    
    // Check if image is accessible
    try {
      await httpGet(imageUrl)
    } catch (error) {
      console.log(`Image not accessible: ${error.message}`)
      return null
    }
    
    // Use node-vibrant to extract colors
    const palette = await Vibrant.from(imageUrl).getPalette()
    
    // Get the most vibrant colors
    const vibrant = palette.Vibrant
    const darkVibrant = palette.DarkVibrant
    const lightVibrant = palette.LightVibrant
    const muted = palette.Muted
    const darkMuted = palette.DarkMuted
    
    let primary = null
    let secondary = null
    
    // Primary color selection logic
    if (vibrant && vibrant.hex) {
      primary = vibrant.hex
    } else if (darkVibrant && darkVibrant.hex) {
      primary = darkVibrant.hex
    } else if (muted && muted.hex) {
      primary = muted.hex
    }
    
    // Secondary color selection logic
    if (lightVibrant && lightVibrant.hex && lightVibrant.hex !== primary) {
      secondary = lightVibrant.hex
    } else if (darkMuted && darkMuted.hex && darkMuted.hex !== primary) {
      secondary = darkMuted.hex
    } else if (muted && muted.hex && muted.hex !== primary) {
      secondary = muted.hex
    }
    
    // Validate colors for good contrast and usability
    if (primary && secondary) {
      const contrast = getContrastRatio(primary, secondary)
      
      // If contrast is too low, try to adjust
      if (contrast < 2.0) {
        console.log(`Low contrast detected: ${contrast}, attempting adjustment`)
        
        // If both colors are too light or too dark, replace secondary
        if (isColorTooLight(primary) && isColorTooLight(secondary)) {
          secondary = '#1F2937' // Dark gray
        } else if (isColorTooDark(primary) && isColorTooDark(secondary)) {
          secondary = '#F3F4F6' // Light gray
        }
      }
    }
    
    // Final validation - ensure we have usable colors
    if (primary && (isColorTooLight(primary) || isColorTooDark(primary))) {
      console.log(`Primary color ${primary} is not suitable, discarding`)
      primary = null
    }
    
    if (secondary && (isColorTooLight(secondary) || isColorTooDark(secondary))) {
      console.log(`Secondary color ${secondary} is not suitable, using fallback`)
      secondary = primary === '#1E40AF' ? '#F59E0B' : '#1E40AF' // Ensure contrast
    }
    
    return primary && secondary ? { primary, secondary } : null
    
  } catch (error) {
    console.log(`Error extracting colors from ${imageUrl}:`, error.message)
    return null
  }
}

// Add new columns to the leads table
async function addColorColumns() {
  try {
    console.log('Adding primary_color and secondary_color columns...')
    
    // Add primary_color column
    const { error: primaryError } = await supabase.rpc('add_column_if_not_exists', {
      table_name: 'leads',
      column_name: 'primary_color',
      column_type: 'VARCHAR(7)'
    })
    
    if (primaryError) {
      console.log('Primary color column might already exist:', primaryError.message)
    }
    
    // Add secondary_color column
    const { error: secondaryError } = await supabase.rpc('add_column_if_not_exists', {
      table_name: 'leads',
      column_name: 'secondary_color',
      column_type: 'VARCHAR(7)'
    })
    
    if (secondaryError) {
      console.log('Secondary color column might already exist:', secondaryError.message)
    }
    
    // Alternative: use direct SQL if RPC doesn't work
    try {
      await supabase.from('leads').select('primary_color').limit(1)
    } catch (error) {
      if (error.message.includes('column "primary_color" does not exist')) {
        console.log('Creating primary_color column with direct SQL...')
        // You would need to run this SQL manually in your database:
        console.log('Please run this SQL in your database:')
        console.log('ALTER TABLE leads ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7);')
        console.log('ALTER TABLE leads ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7);')
      }
    }
    
    console.log('Color columns ready!')
    
  } catch (error) {
    console.error('Error adding color columns:', error)
    throw error
  }
}

// Process all businesses
async function processAllBusinesses() {
  try {
    console.log('Starting logo and color processing...')
    
    // Add the new columns first
    await addColorColumns()
    
    // Get all businesses with logos
    const { data: businesses, error } = await supabase
      .from('leads')
      .select('id, name, business_type, logo')
      .not('logo', 'is', null)
      .neq('logo', '')
      .is('primary_color', null) // Only process businesses without colors yet
      .order('id')
    
    if (error) {
      throw error
    }
    
    console.log(`Found ${businesses.length} businesses with logos to process`)
    
    let processed = 0
    let successful = 0
    let failed = 0
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 10
    for (let i = 0; i < businesses.length; i += batchSize) {
      const batch = businesses.slice(i, i + batchSize)
      
      console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(businesses.length / batchSize)}`)
      
      // Process batch in parallel
      const batchPromises = batch.map(async (business) => {
        try {
          console.log(`\nProcessing: ${business.name}`)
          
          // Clean up the logo URL
          const cleanedLogoUrl = cleanLogoUrl(business.logo)
          console.log(`Original: ${business.logo}`)
          console.log(`Cleaned:  ${cleanedLogoUrl}`)
          
          // Extract colors from the cleaned logo
          const colors = await extractColorsFromImage(cleanedLogoUrl)
          
          let finalColors
          
          if (colors) {
            console.log(`✅ Extracted colors: Primary=${colors.primary}, Secondary=${colors.secondary}`)
            finalColors = colors
          } else {
            console.log(`❌ Could not extract colors, using fallback`)
            finalColors = getFallbackColors(business.business_type)
          }
          
          // Update the business with cleaned logo URL and colors
          const { error: updateError } = await supabase
            .from('leads')
            .update({
              logo: cleanedLogoUrl,
              primary_color: finalColors.primary,
              secondary_color: finalColors.secondary
            })
            .eq('id', business.id)
          
          if (updateError) {
            console.error(`Error updating ${business.name}:`, updateError)
            failed++
          } else {
            console.log(`✅ Updated ${business.name} successfully`)
            successful++
          }
          
        } catch (error) {
          console.error(`Error processing ${business.name}:`, error.message)
          failed++
        }
        
        processed++
      })
      
      // Wait for batch to complete
      await Promise.all(batchPromises)
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log(`Progress: ${processed}/${businesses.length} (${successful} successful, ${failed} failed)`)
    }
    
    console.log('\n=== PROCESSING COMPLETE ===')
    console.log(`Total processed: ${processed}`)
    console.log(`Successful: ${successful}`)
    console.log(`Failed: ${failed}`)
    console.log(`Success rate: ${Math.round((successful / processed) * 100)}%`)
    
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

// Main execution
if (require.main === module) {
  processAllBusinesses()
    .then(() => {
      console.log('Script completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Script failed:', error)
      process.exit(1)
    })
}

module.exports = {
  cleanLogoUrl,
  extractColorsFromImage,
  getFallbackColors,
  processAllBusinesses
}