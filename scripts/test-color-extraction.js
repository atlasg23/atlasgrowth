const { cleanLogoUrl, extractColorsFromImage, getFallbackColors } = require('./process-logos-and-colors')

// Test URLs with Google logo format
const testUrls = [
  'https://lh3.googleusercontent.com/-2SXCQwkdL90/AAAAAAAAAAI/AAAAAAAAAAA/sjgVPL1u_lc/s44-p-k-no-ns-nd/photo.jpg',
  'https://lh3.googleusercontent.com/-ABC123DEF/AAAAAAAAAAI/AAAAAAAAAAA/xyz789/s96-c-k-no-ns-nd/photo.jpg',
  'https://example.com/regular-logo.png'
]

async function testColorExtraction() {
  console.log('=== Testing Logo URL Cleaning ===')
  
  testUrls.forEach(url => {
    const cleaned = cleanLogoUrl(url)
    console.log(`Original: ${url}`)
    console.log(`Cleaned:  ${cleaned}`)
    console.log('---')
  })
  
  console.log('\n=== Testing Fallback Colors ===')
  
  const businessTypes = ['plumbing', 'hvac', 'electrical', 'roofing', 'pest control']
  businessTypes.forEach(type => {
    const colors = getFallbackColors(type)
    console.log(`${type}: Primary=${colors.primary}, Secondary=${colors.secondary}`)
  })
  
  console.log('\n=== Testing Color Extraction ===')
  
  // Test with a publicly accessible logo
  const testImageUrl = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200'
  
  try {
    console.log(`Testing color extraction from: ${testImageUrl}`)
    const colors = await extractColorsFromImage(testImageUrl)
    
    if (colors) {
      console.log(`✅ Success! Primary: ${colors.primary}, Secondary: ${colors.secondary}`)
    } else {
      console.log('❌ Could not extract colors')
    }
  } catch (error) {
    console.error('❌ Error during color extraction:', error.message)
  }
  
  console.log('\n=== Test Complete ===')
}

testColorExtraction()