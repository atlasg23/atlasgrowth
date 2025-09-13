// Test image resolution for templates
require('dotenv').config({ path: '.env.local' })

// Mock the supabase client for testing
const mockSupabase = {
  storage: {
    from: (bucket) => ({
      getPublicUrl: (path) => ({
        data: {
          publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
        }
      })
    })
  }
}

// Mock the module resolution
require.cache[require.resolve('./lib/supabase')] = {
  exports: { supabase: mockSupabase }
}

const { resolveBusinessImages } = require('./lib/images')

// Test different business configurations
const testCases = [
  {
    name: 'Business with no overrides',
    business: {
      slug: 'test-plumber',
      business_type: 'plumbing',
      niche: 'plumbing'
    }
  },
  {
    name: 'Business with image overrides',
    business: {
      slug: 'custom-plumber',
      business_type: 'plumbing',
      niche: 'plumbing',
      image_overrides: {
        logo: 'https://example.com/custom-logo.png',
        hero: 'business/custom-plumber/hero.jpg',
        about: 'https://example.com/custom-about.jpg'
      }
    }
  },
  {
    name: 'Business with legacy logo',
    business: {
      slug: 'legacy-plumber',
      business_type: 'plumbing',
      logo: 'https://lh3.googleusercontent.com/p/legacy-logo.jpg'
    }
  },
  {
    name: 'HVAC business',
    business: {
      slug: 'test-hvac',
      business_type: 'hvac',
      niche: 'hvac'
    }
  }
]

console.log('Testing image resolution...\n')
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('=====================================\n')

testCases.forEach(test => {
  console.log(`\n📸 ${test.name}:`)
  console.log('Input:', JSON.stringify(test.business, null, 2))

  try {
    const images = resolveBusinessImages(test.business)
    console.log('✅ Resolved images:')
    console.log('  Logo:', images.logoUrl)
    console.log('  Hero:', images.heroUrl)
    console.log('  About:', images.aboutUrl)
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
  console.log('---')
})