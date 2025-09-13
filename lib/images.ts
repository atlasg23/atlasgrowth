import { supabase } from './supabase'
import templateImageDefaults from '@/data/templateImageDefaults.json'

export type ImageType = 'logo' | 'hero' | 'about'
export type ResolvedImages = {
  logoUrl: string
  heroUrl: string
  aboutUrl: string
}

interface Business {
  slug: string
  business_type?: string
  niche?: string
  image_overrides?: {
    logo?: string
    hero?: string
    about?: string
  }
  logo?: string // Legacy field
}

const BUSINESS_ASSETS_BUCKET = 'business-assets'

// Get public URL from storage path
function getPublicUrlFromPath(path: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from(BUSINESS_ASSETS_BUCKET)
    .getPublicUrl(path)
  return publicUrl
}

// Normalize business type for template lookup
function normalizeBusinessType(businessType?: string, niche?: string): string {
  const type = businessType || niche || ''
  return type.toLowerCase().trim()
}

// Resolve single image with fallback logic
function resolveImage(
  business: Business, 
  imageType: ImageType, 
  templateType: string
): string {
  // 1. Check business-specific override
  if (business.image_overrides?.[imageType]) {
    const override = business.image_overrides[imageType]
    // If it's already a full URL (external), return as-is
    if (override.startsWith('http://') || override.startsWith('https://')) {
      return override
    }
    // Otherwise, it's a storage path, get public URL
    return getPublicUrlFromPath(override)
  }

  // 2. Check legacy logo field for logo type only
  if (imageType === 'logo' && business.logo) {
    return business.logo
  }

  // 3. Check template default
  const templateDefaults = (templateImageDefaults as any)[templateType]
  if (templateDefaults?.[imageType]) {
    return getPublicUrlFromPath(templateDefaults[imageType])
  }

  // 4. Fall back to global default
  const globalDefaults = (templateImageDefaults as any).global
  if (globalDefaults?.[imageType]) {
    return getPublicUrlFromPath(globalDefaults[imageType])
  }

  // 5. Final fallback - use real working images
  const fallbackImages = {
    logo: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400',
    hero: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1200',
    about: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800'
  }
  return fallbackImages[imageType] || 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400'
}

// Main resolver function
export function resolveBusinessImages(business: Business): ResolvedImages {
  const templateType = normalizeBusinessType((business as any).business_type, business.niche)
  
  return {
    logoUrl: resolveImage(business, 'logo', templateType),
    heroUrl: resolveImage(business, 'hero', templateType),
    aboutUrl: resolveImage(business, 'about', templateType)
  }
}

// Get template image URL for specific type
export function getTemplateImageUrl(templateType: string, imageType: ImageType): string {
  const normalizedType = templateType.toLowerCase().trim()
  const defaults = (templateImageDefaults as any)[normalizedType]
  
  if (defaults?.[imageType]) {
    return getPublicUrlFromPath(defaults[imageType])
  }
  
  // Fall back to global
  const globalDefaults = (templateImageDefaults as any).global
  if (globalDefaults?.[imageType]) {
    return getPublicUrlFromPath(globalDefaults[imageType])
  }
  
  const fallbackImages = {
    logo: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400',
    hero: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1200', 
    about: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800'
  }
  return fallbackImages[imageType] || 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400'
}