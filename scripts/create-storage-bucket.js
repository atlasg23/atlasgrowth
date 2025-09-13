const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createStorageBucket() {
  console.log('🗄️ Creating business-assets storage bucket...')

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      return
    }

    const bucketExists = buckets?.some(b => b.name === 'business-assets')

    if (bucketExists) {
      console.log('✅ Bucket already exists')
      return
    }

    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('business-assets', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
    })

    if (error) {
      console.error('❌ Error creating bucket:', error)
      return
    }

    console.log('✅ Successfully created business-assets bucket')
    console.log('📸 Bucket details:', data)
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

createStorageBucket()