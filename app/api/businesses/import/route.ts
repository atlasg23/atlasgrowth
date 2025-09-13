import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Function to generate slug from business name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
}

// Function to validate and convert data types
function processRowData(row: any, mapping: Record<string, string>) {
  const processedRow: any = {}
  
  for (const [csvColumn, dbField] of Object.entries(mapping)) {
    const value = row[csvColumn]
    
    if (value === null || value === undefined || value === '') {
      continue
    }
    
    // Process based on field type
    switch (dbField) {
      case 'latitude':
      case 'longitude':
      case 'rating':
        const numValue = parseFloat(value)
        if (!isNaN(numValue)) {
          processedRow[dbField] = numValue
        }
        break
        
      case 'reviews':
      case 'photos_count':
        const intValue = parseInt(value)
        if (!isNaN(intValue)) {
          processedRow[dbField] = intValue
        }
        break
        
      case 'verified':
        processedRow[dbField] = ['true', '1', 'yes', 'verified'].includes(String(value).toLowerCase())
        break
        
      case 'email1':
      case 'email2':
      case 'email3':
        // Basic email validation
        const email = String(value).trim()
        if (email.includes('@')) {
          processedRow[dbField] = email
        }
        break
        
      case 'phone':
        // Clean phone number
        const phone = String(value).replace(/[^\d+()-\s]/g, '').trim()
        if (phone) {
          processedRow[dbField] = phone
        }
        break
        
      default:
        processedRow[dbField] = String(value).trim()
    }
  }
  
  // Generate slug if name is provided and slug isn't
  if (processedRow.name && !processedRow.slug) {
    processedRow.slug = generateSlug(processedRow.name)
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
    
    // Check if admin client is available
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database access not configured' },
        { status: 500 }
      )
    }
    
    // Process and validate data
    const processedRows = data.map((row, index) => {
      try {
        const processedRow = processRowData(row, mapping)
        
        // Validate required fields
        if (!processedRow.name) {
          throw new Error(`Row ${index + 1}: Business name is required`)
        }
        
        return processedRow
      } catch (error) {
        throw new Error(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Invalid data'}`)
      }
    })
    
    // Get existing slugs to avoid duplicates
    const existingSlugs = new Set()
    if (processedRows.some(row => row.slug)) {
      const { data: existing } = await supabaseAdmin
        .from('biz')
        .select('slug')
        .in('slug', processedRows.map(row => row.slug).filter(Boolean))
      
      existing?.forEach(row => existingSlugs.add(row.slug))
    }
    
    // Filter out duplicates and prepare for insert
    const rowsToInsert = []
    const duplicateRows = []
    const errorRows = []
    
    for (let i = 0; i < processedRows.length; i++) {
      const row = processedRows[i]
      
      // Check for duplicate slug
      if (row.slug && existingSlugs.has(row.slug)) {
        duplicateRows.push({
          row: i + 1,
          reason: `Business with slug '${row.slug}' already exists`,
          data: row
        })
        continue
      }
      
      // Add to insert batch
      rowsToInsert.push({
        ...row,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      // Mark slug as used
      if (row.slug) {
        existingSlugs.add(row.slug)
      }
    }
    
    let insertedCount = 0
    let insertErrors: any[] = []
    
    if (rowsToInsert.length > 0) {
      // Insert in batches of 50 to avoid hitting limits
      const batchSize = 50
      for (let i = 0; i < rowsToInsert.length; i += batchSize) {
        const batch = rowsToInsert.slice(i, i + batchSize)
        
        const { data: inserted, error } = await supabaseAdmin
          .from('biz')
          .insert(batch)
          .select('id, name, slug')
        
        if (error) {
          insertErrors.push({
            batch: Math.floor(i / batchSize) + 1,
            error: error.message,
            rows: batch.length
          })
        } else {
          insertedCount += batch.length
        }
      }
    }
    
    // Prepare response
    const response = {
      success: true,
      summary: {
        totalRows: data.length,
        processed: processedRows.length,
        inserted: insertedCount,
        duplicates: duplicateRows.length,
        errors: insertErrors.length
      },
      details: {
        duplicateRows: duplicateRows.slice(0, 10), // Limit to first 10
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