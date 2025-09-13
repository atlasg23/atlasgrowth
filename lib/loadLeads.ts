import { supabase } from '@/lib/supabase'

export interface Lead {
  id: string
  business_type: string
  name: string
  phone: string
  email_1?: string
  email_1_emails_validator_status?: string
  site?: string
  city: string
  state: string
  rating?: string
  reviews?: string
  photo?: string
  photos_count?: string
  verified?: string
  place_id?: string
  facebook?: string
  instagram?: string
  linkedin?: string
  full_address?: string
  [key: string]: any
}

export async function getLeadBySlugAndType(slug: string, templateType: string): Promise<Lead | null> {
  try {
    console.log('🔍 Looking for slug:', slug, 'template:', templateType)
    
    // Map template type back to business type
    const getBusinessTypeFromTemplate = (template: string) => {
      switch (template) {
        case 'plumbing-pro': return 'plumbing'
        case 'hvac': return 'hvac'
        case 'fire-protection': return 'fire-protection'
        case 'pest-control': return 'pest-control'
        case 'pressure-washing': return 'pressure-washing'
        case 'roofing': return 'roofing'
        case 'tree-service': return 'tree-service'
        default: return template
      }
    }
    
    const businessType = getBusinessTypeFromTemplate(templateType)
    console.log('🏢 Mapped business type:', businessType)
    
    // Query directly using the slug field from database
    const { data: matchingLead, error } = await supabase
      .from('leads')
      .select('*')
      .ilike('business_type', `%${businessType}%`)
      .eq('slug', slug)
      .single()
    
    if (error) {
      console.log('❌ No lead found with slug:', slug, 'and business type:', businessType)
      return null
    }

    console.log('✅ Found matching lead:', matchingLead.name, 'with slug:', slug)
    return matchingLead as Lead
  } catch (error) {
    console.error('Error in getLeadBySlugAndType:', error)
    return null
  }
}