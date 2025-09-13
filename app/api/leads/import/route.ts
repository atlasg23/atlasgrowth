import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Function to process row data for leads table
function processRowData(row: any, businessType: string, sourceFile: string) {
  const processedRow: any = {
    business_type: businessType,
    source_file: sourceFile
  }
  
  // Map all possible fields from Outscraper data
  const fieldMappings = {
    // Core fields
    'query': 'query',
    'name': 'name', 
    'name_for_emails': 'name_for_emails',
    'site': 'site',
    'subtypes': 'subtypes',
    'category': 'category',
    'type': 'type',
    
    // Phone fields
    'phone': 'phone',
    'phone.phones_enricher.carrier_type': 'phone_phones_enricher_carrier_type',
    'phone.phones_enricher.carrier_name': 'phone_phones_enricher_carrier_name',
    
    // Address
    'full_address': 'full_address',
    'borough': 'borough',
    'street': 'street',
    'city': 'city',
    'postal_code': 'postal_code',
    'state': 'state',
    'us_state': 'us_state',
    'country': 'country',
    'country_code': 'country_code',
    'latitude': 'latitude',
    'longitude': 'longitude',
    'h3': 'h3',
    'time_zone': 'time_zone',
    'plus_code': 'plus_code',
    'area_service': 'area_service',
    
    // Reviews
    'rating': 'rating',
    'reviews': 'reviews', 
    'reviews_link': 'reviews_link',
    'reviews_tags': 'reviews_tags',
    'reviews_per_score': 'reviews_per_score',
    'reviews_per_score_1': 'reviews_per_score_1',
    'reviews_per_score_2': 'reviews_per_score_2',
    'reviews_per_score_3': 'reviews_per_score_3',
    'reviews_per_score_4': 'reviews_per_score_4',
    'reviews_per_score_5': 'reviews_per_score_5',
    
    // Photos and visuals
    'photos_count': 'photos_count',
    'photo': 'photo',
    'street_view': 'street_view',
    'logo': 'logo',
    
    // Business details
    'located_in': 'located_in',
    'working_hours': 'working_hours',
    'working_hours_csv_compatible': 'working_hours_csv_compatible',
    'working_hours_old_format': 'working_hours_old_format',
    'other_hours': 'other_hours',
    'popular_times': 'popular_times',
    'business_status': 'business_status',
    'about': 'about',
    'range': 'range',
    'prices': 'prices',
    'posts': 'posts',
    'description': 'description',
    'typical_time_spent': 'typical_time_spent',
    'verified': 'verified',
    
    // Owner
    'owner_id': 'owner_id',
    'owner_title': 'owner_title', 
    'owner_link': 'owner_link',
    
    // Links
    'reservation_links': 'reservation_links',
    'booking_appointment_link': 'booking_appointment_link',
    'menu_link': 'menu_link',
    'order_links': 'order_links',
    'location_link': 'location_link',
    'location_reviews_link': 'location_reviews_link',
    
    // Google IDs
    'place_id': 'place_id',
    'google_id': 'google_id',
    'cid': 'cid',
    'kgmid': 'kgmid',
    'reviews_id': 'reviews_id',
    'located_google_id': 'located_google_id',
    
    // Emails
    'email_1': 'email_1',
    'email_1.emails_validator.status': 'email_1_emails_validator_status',
    'email_1.emails_validator.status_details': 'email_1_emails_validator_status_details',
    'email_1_full_name': 'email_1_full_name',
    'email_1_first_name': 'email_1_first_name',
    'email_1_last_name': 'email_1_last_name',
    'email_1_title': 'email_1_title',
    'email_1_phone': 'email_1_phone',
    
    'email_2': 'email_2',
    'email_2.emails_validator.status': 'email_2_emails_validator_status',
    'email_2.emails_validator.status_details': 'email_2_emails_validator_status_details',
    'email_2_full_name': 'email_2_full_name',
    'email_2_first_name': 'email_2_first_name',
    'email_2_last_name': 'email_2_last_name',
    'email_2_title': 'email_2_title',
    'email_2_phone': 'email_2_phone',
    
    'email_3': 'email_3',
    'email_3.emails_validator.status': 'email_3_emails_validator_status',
    'email_3.emails_validator.status_details': 'email_3_emails_validator_status_details',
    'email_3_full_name': 'email_3_full_name',
    'email_3_first_name': 'email_3_first_name',
    'email_3_last_name': 'email_3_last_name',
    'email_3_title': 'email_3_title',
    'email_3_phone': 'email_3_phone',
    
    // Additional phones
    'phone_1': 'phone_1',
    'phone_1.phones_enricher.carrier_name': 'phone_1_phones_enricher_carrier_name',
    'phone_1.phones_enricher.carrier_type': 'phone_1_phones_enricher_carrier_type',
    
    'phone_2': 'phone_2', 
    'phone_2.phones_enricher.carrier_name': 'phone_2_phones_enricher_carrier_name',
    'phone_2.phones_enricher.carrier_type': 'phone_2_phones_enricher_carrier_type',
    
    'phone_3': 'phone_3',
    'phone_3.phones_enricher.carrier_name': 'phone_3_phones_enricher_carrier_name',
    'phone_3.phones_enricher.carrier_type': 'phone_3_phones_enricher_carrier_type',
    
    // Social media
    'facebook': 'facebook',
    'instagram': 'instagram',
    'linkedin': 'linkedin',
    'tiktok': 'tiktok',
    'medium': 'medium',
    'reddit': 'reddit',
    'skype': 'skype',
    'snapchat': 'snapchat',
    'telegram': 'telegram',
    'whatsapp': 'whatsapp',
    'twitter': 'twitter',
    'vimeo': 'vimeo',
    'youtube': 'youtube',
    'github': 'github',
    'crunchbase': 'crunchbase',
    
    // Website
    'website_title': 'website_title',
    'website_generator': 'website_generator',
    'website_description': 'website_description',
    'website_keywords': 'website_keywords',
    'website_has_fb_pixel': 'website_has_fb_pixel',
    'website_has_google_tag': 'website_has_google_tag',
    
    // Company insights
    'company_insights.address': 'company_insights_address',
    'company_insights.city': 'company_insights_city',
    'company_insights.country': 'company_insights_country',
    'company_insights.description': 'company_insights_description',
    'company_insights.employees': 'company_insights_employees',
    'company_insights.founded_year': 'company_insights_founded_year',
    'company_insights.industry': 'company_insights_industry',
    'company_insights.is_public': 'company_insights_is_public',
    'company_insights.linkedin_bio': 'company_insights_linkedin_bio',
    'company_insights.linkedin_company_page': 'company_insights_linkedin_company_page',
    'company_insights.name': 'company_insights_name',
    'company_insights.phone': 'company_insights_phone',
    'company_insights.revenue': 'company_insights_revenue',
    'company_insights.state': 'company_insights_state',
    'company_insights.timezone': 'company_insights_timezone',
    'company_insights.zip': 'company_insights_zip',
    'company_insights.facebook_company_page': 'company_insights_facebook_company_page',
    'company_insights.twitter_handle': 'company_insights_twitter_handle',
    'company_insights.total_money_raised': 'company_insights_total_money_raised'
  }
  
  // Process each field
  for (const [csvField, dbField] of Object.entries(fieldMappings)) {
    const value = row[csvField]
    
    if (value === null || value === undefined || value === '') {
      continue
    }
    
    // Type-specific processing
    switch (dbField) {
      case 'latitude':
      case 'longitude':
        const numValue = parseFloat(value)
        if (!isNaN(numValue)) {
          processedRow[dbField] = numValue
        }
        break
        
      case 'cid':
        // Keep as text since values can be very large
        processedRow[dbField] = String(value).trim()
        break
        
      case 'area_service':
        processedRow[dbField] = ['true', '1', 'yes', 'True', 'TRUE'].includes(String(value))
        break
        
      case 'about':
        try {
          if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
            processedRow[dbField] = JSON.parse(value)
          } else {
            processedRow[dbField] = value
          }
        } catch {
          processedRow[dbField] = value
        }
        break
        
      default:
        const cleanValue = String(value).trim()
        if (cleanValue && cleanValue !== 'N/A' && cleanValue !== 'null') {
          processedRow[dbField] = cleanValue
        }
    }
  }
  
  return processedRow
}

export async function POST(request: NextRequest) {
  try {
    const { data, businessType, sourceFile } = await request.json()
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'No data provided' },
        { status: 400 }
      )
    }
    
    if (!businessType) {
      return NextResponse.json(
        { error: 'Business type is required' },
        { status: 400 }
      )
    }
    
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database access not configured' },
        { status: 500 }
      )
    }
    
    console.log(`Processing ${data.length} ${businessType} records from ${sourceFile}`)
    
    // Process all records
    const processedRows = []
    const errorRows = []
    
    for (let i = 0; i < data.length; i++) {
      try {
        const processedRow = processRowData(data[i], businessType, sourceFile || 'unknown')
        
        if (!processedRow.name) {
          throw new Error('Business name is required')
        }
        
        processedRows.push(processedRow)
      } catch (error) {
        errorRows.push({
          row: i + 1,
          reason: error instanceof Error ? error.message : 'Invalid data',
          data: data[i]
        })
      }
    }
    
    let insertedCount = 0
    const insertErrors: any[] = []
    let duplicateCount = 0
    
    if (processedRows.length > 0) {
      // Insert in batches of 20 (smaller for complex schema)
      const batchSize = 20
      for (let i = 0; i < processedRows.length; i += batchSize) {
        const batch = processedRows.slice(i, i + batchSize)
        
        const { data: inserted, error } = await supabaseAdmin
          .from('leads')
          .insert(batch)
          .select('id, name, place_id')
        
        if (error) {
          console.error('Batch insert error:', error)
          // Check if it's a duplicate place_id error
          if (error.message?.includes('duplicate key') && error.message?.includes('place_id')) {
            duplicateCount += batch.length
          } else {
            insertErrors.push({
              batch: Math.floor(i / batchSize) + 1,
              error: error.message,
              rows: batch.length,
              details: error.details || error.hint || ''
            })
          }
        } else {
          insertedCount += batch.length
        }
      }
    }
    
    const response = {
      success: insertErrors.length === 0,
      summary: {
        totalRows: data.length,
        processed: processedRows.length,
        inserted: insertedCount,
        duplicates: duplicateCount,
        errors: errorRows.length + insertErrors.length,
        businessType,
        sourceFile
      },
      details: {
        errorRows: errorRows.slice(0, 10),
        insertErrors: insertErrors
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Import failed',
        success: false
      },
      { status: 500 }
    )
  }
}