import { getAllSlugs, getBizBySlug, getAllBusinessesByTemplate } from '@/lib/loadBiz'
import PlumbingT1 from '@/templates/plumbing_t1'
import HvacT1 from '@/templates/hvac_t1'
import { Business } from '@/types/business'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

type Params = {
  template: string
  slug: string
}

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = getAllSlugs()
  const params: Params[] = []
  
  for (const slug of slugs) {
    const business = getBizBySlug(slug)
    if (business) {
      params.push({
        template: business.template_key,
        slug: business.slug
      })
    }
  }
  
  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const resolvedParams = await params
  const business = getBizBySlug(resolvedParams.slug)
  
  if (!business) {
    return {
      title: 'Business Not Found',
    }
  }

  return {
    title: `${business.name} | ${business.niche} in ${business.city}`,
    description: `${business.name} - Professional ${business.niche} services in ${business.city}, ${business.state}. Call ${business.phone} for quality service.`,
    openGraph: {
      title: `${business.name} | ${business.niche} in ${business.city}`,
      description: `${business.name} - Professional ${business.niche} services in ${business.city}, ${business.state}. Call ${business.phone} for quality service.`,
      type: 'website',
    },
  }
}

export default async function BusinessPage({ params }: { params: Promise<Params> }) {
  const resolvedParams = await params
  const business = getBizBySlug(resolvedParams.slug)
  
  if (!business || business.template_key !== resolvedParams.template) {
    notFound()
  }

  // Set CSS custom properties for this business
  const customStyles = {
    '--primary': business.primary_color || (business.template_key === 'plumbing_t1' ? '#0EA5E9' : '#1E3A8A'),
    '--secondary': business.secondary_color || (business.template_key === 'plumbing_t1' ? '#F59E0B' : '#10B981'),
  } as React.CSSProperties

  const TemplateComponent = business.template_key === 'plumbing_t1' ? PlumbingT1 : HvacT1

  return (
    <div style={customStyles}>
      <TemplateComponent business={business} />
      
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": business.name,
            "description": `Professional ${business.niche} services in ${business.city}, ${business.state}`,
            "telephone": business.phone,
            "email": business.email1_status === 'valid' ? business.email1 : undefined,
            "url": business.site,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": business.addr1,
              "addressLocality": business.city,
              "addressRegion": business.state,
              "postalCode": business.postal
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": business.latitude,
              "longitude": business.longitude
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": business.rating,
              "reviewCount": business.reviews
            },
            "sameAs": [
              business.facebook,
              business.instagram
            ].filter(Boolean)
          })
        }}
      />
    </div>
  )
}
