const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testTemplateImages() {
  console.log('🔍 Testing template image display...\n')

  // Test a real business from the database
  const { data: leads, error } = await supabase
    .from('leads')
    .select('slug, name, business_type, logo, image_overrides')
    .limit(5)

  if (error) {
    console.error('Error fetching leads:', error)
    return
  }

  console.log(`Found ${leads.length} businesses to test:\n`)

  leads.forEach(lead => {
    console.log(`\n📦 Business: ${lead.name}`)
    console.log(`   Slug: ${lead.slug}`)
    console.log(`   Type: ${lead.business_type}`)
    console.log(`   Logo: ${lead.logo || 'none'}`)
    console.log(`   Image Overrides: ${JSON.stringify(lead.image_overrides) || 'none'}`)

    // Check what template URL would be
    const templateMap = {
      'plumbing': 'plumbing-pro',
      'hvac': 'hvac',
      'fire-protection': 'fire-protection',
      'pest-control': 'pest-control'
    }

    const templateKey = templateMap[lead.business_type] || lead.business_type
    const url = `/${templateKey}/${lead.slug}/`
    console.log(`   Template URL: ${url}`)
  })

  // Test Supabase storage bucket
  console.log('\n\n🗄️ Testing Supabase Storage:')
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()

  if (bucketError) {
    console.log('❌ Cannot list buckets:', bucketError.message)
  } else {
    console.log('✅ Available buckets:', buckets.map(b => b.name).join(', '))

    // Check if business-assets bucket exists
    const hasBusinessAssets = buckets.some(b => b.name === 'business-assets')
    if (hasBusinessAssets) {
      console.log('✅ business-assets bucket exists')

      // Generate a test public URL
      const testPath = 'business/test/logo.jpg'
      const { data: { publicUrl } } = supabase.storage
        .from('business-assets')
        .getPublicUrl(testPath)
      console.log(`📸 Sample storage URL: ${publicUrl}`)
    } else {
      console.log('⚠️ business-assets bucket does not exist - need to create it')
    }
  }

  // Test fallback image URLs
  console.log('\n\n🌐 Testing fallback image URLs:')
  const fallbackImages = [
    'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400',
    'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1200',
    'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800'
  ]

  for (const url of fallbackImages) {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      if (response.ok) {
        console.log(`✅ ${url.substring(0, 50)}...`)
      } else {
        console.log(`❌ ${url.substring(0, 50)}... (Status: ${response.status})`)
      }
    } catch (err) {
      console.log(`❌ ${url.substring(0, 50)}... (Error: ${err.message})`)
    }
  }
}

testTemplateImages().catch(console.error)