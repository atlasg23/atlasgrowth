import { Lead } from '@/types/lead'
import { Business } from '@/types/business'

/**
 * Adapter function to convert Lead data to Business format for compatibility
 * with existing components like BusinessDetailTabs
 */
export function adaptLeadToBusiness(lead: Lead): Business {
  return {
    id: lead.id,
    name: lead.name,
    niche: lead.business_type,
    phone: lead.phone || '',
    phone_carrier_type: lead.phone_phones_enricher_carrier_type,
    email1: lead.email_1,
    email1_status: lead.email_1_emails_validator_status,
    site: lead.site,
    addr1: lead.full_address || lead.street || '',
    city: lead.city || '',
    state: lead.state || '',
    postal: lead.postal_code || '',
    rating: lead.rating ? parseFloat(lead.rating) : undefined,
    reviews: lead.reviews ? parseInt(lead.reviews) : undefined,
    reviews_link: lead.reviews_link,
    verified: lead.verified === 'true',
    photos_count: lead.photos_count ? parseInt(lead.photos_count) : undefined,
    place_id: lead.place_id,
    facebook: lead.facebook,
    instagram: lead.instagram,
    linkedin: lead.linkedin,
    
    // Default/empty values for Business fields that don't exist in Lead
    slug: lead.slug || (lead.name ? lead.name.toLowerCase().replace(/[^a-z0-9]/g, '') : lead.id),
    template_key: lead.business_type ? lead.business_type.toLowerCase().replace(/\s+/g, '-') : 'general',
    hero_image: undefined,
    about_image: undefined,
    logo: undefined,
    primary_color: undefined,
    secondary_color: undefined,
    
    // Optional fields that may not be directly mappable
    email2: lead.email_2,
    email3: lead.email_3,
    phone2: lead.phone_1,
    phone3: lead.phone_2,
    
    // Additional fields from lead that don't have direct Business equivalents
    business_status: lead.business_status,
    working_hours: lead.working_hours,
    description: lead.description,
    
    created_at: lead.created_at,
    updated_at: lead.updated_at
  } as Business
}