import { getLeadBySlugAndType } from '@/lib/loadLeads'
import PlumbingTemplatePro from '@/components/templates/PlumbingTemplatePro'
import PestControlTemplate from '@/components/templates/PestControlTemplate'
import PressureWashingTemplate from '@/components/templates/PressureWashingTemplate'
import TreeServiceTemplate from '@/components/templates/TreeServiceTemplate'
import { notFound } from 'next/navigation'

// Remove generateStaticParams - use dynamic routing instead

export default async function BusinessPage({ 
  params 
}: { 
  params: Promise<{template: string, slug: string}> 
}) {
  const { template, slug } = await params
  
  // Map URL template name back to template key for validation
  const expectedTemplateKey = template
  
  const lead = await getLeadBySlugAndType(slug, expectedTemplateKey)
  
  if (!lead) {
    notFound()
  }

  // Select the appropriate template component (only 4 templates)
  const getTemplateComponent = (templateKey: string) => {
    switch (templateKey) {
      case 'plumbing-pro': return PlumbingTemplatePro
      case 'pest-control': return PestControlTemplate
      case 'pressure-washing': return PressureWashingTemplate
      case 'tree-service': return TreeServiceTemplate
      default: return PlumbingTemplatePro // fallback
    }
  }

  const TemplateComponent = getTemplateComponent(expectedTemplateKey)

  // Convert lead to business format for templates
  // Extract image overrides if they exist
  const imageOverrides = lead.image_overrides || {}

  const business = {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email1: lead.email_1,
    email1_status: lead.email_1_emails_validator_status,
    site: lead.site,
    city: lead.city,
    state: lead.state,
    rating: lead.rating ? parseFloat(lead.rating) : undefined,
    reviews: lead.reviews ? parseInt(lead.reviews) : undefined,
    photo: lead.photo,
    photos_count: lead.photos_count ? parseInt(lead.photos_count) : undefined,
    verified: lead.verified === 'TRUE',
    place_id: lead.place_id,
    facebook: lead.facebook,
    instagram: lead.instagram,
    linkedin: lead.linkedin,
    business_type: lead.business_type,
    niche: lead.business_type,
    addr1: lead.full_address,
    postal: lead.postal_code,
    slug: slug,
    template_key: lead.business_type,
    primary_color: undefined,
    secondary_color: undefined,
    logo: imageOverrides.logo || lead.logo,
    hero_image: imageOverrides.hero,
    about_image: imageOverrides.about,
    image_overrides: imageOverrides, // Pass the overrides object for proper resolution
    phone_carrier_type: lead.phone_phones_enricher_carrier_type,
    working_hours: lead.working_hours ? JSON.parse(lead.working_hours) : undefined,
    latitude: lead.latitude,
    longitude: lead.longitude
  }

  return <TemplateComponent business={business} />
}