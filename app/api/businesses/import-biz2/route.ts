import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Function to process row data for biz 2 table
function processRowData(row: any, mapping: Record<string, string>) {
  const processedRow: any = {}
  
  for (const [csvColumn, dbField] of Object.entries(mapping)) {
    const value = row[csvColumn]
    
    if (value === null || value === undefined || value === '') {
      continue
    }
    
    // Process based on field type and patterns
    switch (dbField) {
      case 'latitude':
      case 'longitude':
        const numValue = parseFloat(value)
        if (!isNaN(numValue)) {
          processedRow[dbField] = numValue
        }
        break
        
      case 'cid':
        const bigintValue = parseInt(value)
        if (!isNaN(bigintValue)) {
          processedRow[dbField] = bigintValue
        }
        break
        
      case 'area_service':
        processedRow[dbField] = ['true', '1', 'yes', 'True', 'TRUE'].includes(String(value))
        break
        
      case 'about':
        // Handle JSON data
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
        
      // Email fields
      case 'email_1':
      case 'email_2':
      case 'email_3':
        const email = String(value).trim()
        if (email.includes('@')) {
          processedRow[dbField] = email
        }
        break
        
      // Phone fields - clean but preserve formatting
      case 'phone':
      case 'phone_1':
      case 'phone_2':
      case 'phone_3':
      case 'email_1_phone':
      case 'email_2_phone':
      case 'email_3_phone':
        const phone = String(value).trim()
        if (phone) {
          processedRow[dbField] = phone
        }
        break
        
      // URL fields - ensure proper format
      case 'site':
      case 'reviews_link':
      case 'photo':
      case 'street_view':
      case 'logo':
      case 'reservation_links':
      case 'booking_appointment_link':
      case 'menu_link':
      case 'order_links':
      case 'location_link':
      case 'location_reviews_link':
      case 'owner_link':
      case 'facebook':
      case 'instagram':
      case 'linkedin':
      case 'twitter':
      case 'youtube':
      case 'tiktok':
      case 'medium':
      case 'reddit':
      case 'vimeo':
      case 'github':
      case 'crunchbase':
      case 'whatsapp':
        const url = String(value).trim()
        if (url && url !== 'N/A' && url !== 'null') {
          processedRow[dbField] = url
        }
        break
        
      // Rating - handle both numeric and text ratings
      case 'rating':
        const ratingStr = String(value).trim()
        if (ratingStr && ratingStr !== 'N/A' && ratingStr !== 'null') {
          processedRow[dbField] = ratingStr
        }
        break
        
      // Reviews - handle both numeric and text
      case 'reviews':
      case 'photos_count':
      case 'reviews_per_score_1':
      case 'reviews_per_score_2':
      case 'reviews_per_score_3':
      case 'reviews_per_score_4':
      case 'reviews_per_score_5':
        const countStr = String(value).trim()
        if (countStr && countStr !== 'N/A' && countStr !== 'null') {
          processedRow[dbField] = countStr
        }
        break
        
      // Boolean-like text fields
      case 'verified':
      case 'website_has_fb_pixel':
      case 'website_has_google_tag':
      case 'company_insights.is_public':
        const textValue = String(value).trim()
        if (textValue && textValue !== 'N/A' && textValue !== 'null') {
          processedRow[dbField] = textValue
        }
        break
        
      default:
        // Handle all other text fields
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
    const { data, mapping } = await request.json()
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'No data provided' },
        { status: 400 }
      )
    }
    
    if (!mapping || typeof mapping !== 'object') {
      return NextResponse.json(
        { error: 'Column mapping is required' },
        { status: 400 }
      )
    }
    
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database access not configured' },
        { status: 500 }
      )
    }
    
    // Process and validate data
    const processedRows = []
    const errorRows = []
    
    for (let i = 0; i < data.length; i++) {
      try {
        const processedRow = processRowData(data[i], mapping)
        
        // Validate required fields
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
    
    // Check for existing duplicates by name (since biz 2 doesn't have unique constraints)
    const existingNames = new Set()
    if (processedRows.some(row => row.name)) {
      const { data: existing } = await supabaseAdmin
        .from('biz 2')
        .select('name')
        .in('name', processedRows.map(row => row.name).filter(Boolean))
      
      existing?.forEach(row => existingNames.add(row.name))
    }
    
    // Filter duplicates and prepare for insert
    const rowsToInsert = []
    const duplicateRows = []
    
    for (let i = 0; i < processedRows.length; i++) {
      const row = processedRows[i]
      
      // Check for duplicate name
      if (row.name && existingNames.has(row.name)) {
        duplicateRows.push({
          row: i + 1,
          reason: `Business with name '${row.name}' already exists`,
          data: row
        })
        continue
      }
      
      // Add to insert batch
      rowsToInsert.push(row)
      
      // Mark name as used
      if (row.name) {
        existingNames.add(row.name)
      }
    }
    
    let insertedCount = 0
    const insertErrors: any[] = []
    
    if (rowsToInsert.length > 0) {
      // Insert in batches of 25 (smaller batches for complex schema)
      const batchSize = 25
      for (let i = 0; i < rowsToInsert.length; i += batchSize) {
        const batch = rowsToInsert.slice(i, i + batchSize)
        
        const { data: inserted, error } = await supabaseAdmin
          .from('biz 2')
          .insert(batch)
          .select('name')
        
        if (error) {
          console.error('Batch insert error:', error)
          insertErrors.push({
            batch: Math.floor(i / batchSize) + 1,
            error: error.message,
            rows: batch.length,
            details: error.details || error.hint || ''
          })
        } else {
          insertedCount += batch.length
        }
      }
    }
    
    // Prepare response
    const response = {
      success: insertErrors.length === 0,
      summary: {
        totalRows: data.length,
        processed: processedRows.length,
        inserted: insertedCount,
        duplicates: duplicateRows.length,
        errors: errorRows.length + insertErrors.length
      },
      details: {
        duplicateRows: duplicateRows.slice(0, 10),
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