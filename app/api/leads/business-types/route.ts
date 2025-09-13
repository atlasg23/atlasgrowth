import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // For now, only return plumbing as requested by user
    return NextResponse.json({
      businessTypes: ['plumbing']
    })
    
  } catch (error) {
    console.error('Business types error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business types' },
      { status: 500 }
    )
  }
}