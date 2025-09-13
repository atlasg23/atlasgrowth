import { supabase, supabaseAdmin } from './supabase'

export const BUSINESS_ASSETS_BUCKET = 'business-assets'

// Initialize the business assets bucket
export async function initializeBusinessAssetsBucket() {
  try {
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      return { success: false, error: listError }
    }

    const bucketExists = buckets?.some(bucket => bucket.name === BUSINESS_ASSETS_BUCKET)
    
    if (!bucketExists) {
      console.log('Creating business-assets bucket...')
      const { error: createError } = await supabaseAdmin.storage.createBucket(BUSINESS_ASSETS_BUCKET, {
        public: true,
        fileSizeLimit: 10485760 // 10MB limit
      })
      
      if (createError) {
        console.error('Error creating bucket:', createError)
        return { success: false, error: createError }
      }
      console.log('✅ Business assets bucket created successfully')
    } else {
      console.log('✅ Business assets bucket already exists')
    }

    return { success: true }
  } catch (error) {
    console.error('Error initializing bucket:', error)
    return { success: false, error }
  }
}

// Upload image to business assets bucket
export async function uploadBusinessImage(
  file: File, 
  businessSlug: string, 
  imageType: 'logo' | 'hero' | 'about'
) {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `business/${businessSlug}/${imageType}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from(BUSINESS_ASSETS_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error('Upload error:', error)
      return { success: false, error }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUSINESS_ASSETS_BUCKET)
      .getPublicUrl(fileName)

    return { 
      success: true, 
      data: { 
        path: data.path, 
        publicUrl 
      } 
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    return { success: false, error }
  }
}

// Get public URL for a stored image
export function getBusinessImageUrl(businessSlug: string, imageType: 'logo' | 'hero' | 'about', fileExt: string = 'jpg') {
  const fileName = `business/${businessSlug}/${imageType}.${fileExt}`
  const { data: { publicUrl } } = supabase.storage
    .from(BUSINESS_ASSETS_BUCKET)
    .getPublicUrl(fileName)
  
  return publicUrl
}

// Delete business image
export async function deleteBusinessImage(businessSlug: string, imageType: 'logo' | 'hero' | 'about') {
  try {
    // Try common extensions
    const extensions = ['jpg', 'jpeg', 'png', 'webp']
    
    for (const ext of extensions) {
      const fileName = `business/${businessSlug}/${imageType}.${ext}`
      await supabase.storage
        .from(BUSINESS_ASSETS_BUCKET)
        .remove([fileName])
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting image:', error)
    return { success: false, error }
  }
}

// Update business image in database using JSON overrides
export async function updateBusinessImageInDB(
  businessSlug: string, 
  imageType: 'logo' | 'hero' | 'about',
  imageUrl: string
) {
  try {
    // Determine what to store based on URL type
    let valueToStore: string
    
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      // For external URLs, check if it's from our Supabase storage
      const bucketPath = `/storage/v1/object/public/${BUSINESS_ASSETS_BUCKET}/`
      if (imageUrl.includes(bucketPath)) {
        // Extract storage path from our own Supabase URL
        valueToStore = extractStoragePathFromUrl(imageUrl, businessSlug, imageType)
      } else {
        // Store external URL directly
        valueToStore = imageUrl
      }
    } else {
      // Assume it's already a storage path
      valueToStore = imageUrl
    }
    
    console.log(`📸 Updating ${imageType} image for ${businessSlug} with value: ${valueToStore}`)
    
    // Get current image_overrides
    const { data: business, error: fetchError } = await supabase
      .from('leads')
      .select('image_overrides')
      .eq('slug', businessSlug)
      .single()

    if (fetchError) {
      console.error('Error fetching business:', fetchError)
      return { success: false, error: fetchError }
    }

    // Update the image_overrides JSON
    const currentOverrides = business?.image_overrides || {}
    const updatedOverrides = {
      ...currentOverrides,
      [imageType]: valueToStore
    }

    const { error } = await supabase
      .from('leads')
      .update({ 
        image_overrides: updatedOverrides,
        // Also update legacy logo field for backwards compatibility
        ...(imageType === 'logo' && { logo: imageUrl })
      })
      .eq('slug', businessSlug)

    if (error) {
      console.error('Database update error:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating database:', error)
    return { success: false, error }
  }
}

// Extract storage path from full Supabase URL
function extractStoragePathFromUrl(fullUrl: string, businessSlug: string, imageType: string): string {
  // For URLs from our upload system, extract just the path part
  // Example: https://xxx.supabase.co/storage/v1/object/public/business-assets/business/slug/logo.jpg
  // Should return: business/slug/logo.jpg
  
  const bucketPath = `/storage/v1/object/public/${BUSINESS_ASSETS_BUCKET}/`
  const pathIndex = fullUrl.indexOf(bucketPath)
  
  if (pathIndex !== -1) {
    return fullUrl.substring(pathIndex + bucketPath.length)
  }
  
  // Fallback: construct expected path
  const fileExt = fullUrl.split('.').pop() || 'jpg'
  return `business/${businessSlug}/${imageType}.${fileExt}`
}