import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database access not configured' },
        { status: 500 }
      )
    }
    
    const { count, error } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('Count error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ total: count })
    
  } catch (error) {
    console.error('Count endpoint error:', error)
    return NextResponse.json(
      { error: 'Failed to get count' },
      { status: 500 }
    )
  }
}