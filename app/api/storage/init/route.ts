import { NextResponse } from 'next/server'
import { initializeBusinessAssetsBucket } from '@/lib/supabaseStorage'

export async function POST() {
  try {
    const result = await initializeBusinessAssetsBucket()
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Business assets bucket initialized successfully' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Storage init error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to initialize storage' 
    }, { status: 500 })
  }
}