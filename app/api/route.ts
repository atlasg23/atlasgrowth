import { NextResponse } from 'next/server'

// Health check endpoint for monitoring services (no logging to reduce noise)
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
}

export async function HEAD() {
  // Silent health check for Replit monitoring - no console.log to reduce log spam
  return new NextResponse(null, { status: 200 })
}