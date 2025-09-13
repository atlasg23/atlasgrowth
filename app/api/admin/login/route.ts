import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    
    // Simple admin credentials (in production, use proper authentication)
    const validAdmins = [
      { username: process.env.ADMIN_USERNAME || 'nick', password: process.env.ADMIN_PASSWORD || 'admin123' },
      { username: 'jackson', password: 'jackson' }
    ]
    
    const isValidAdmin = validAdmins.some(admin => 
      admin.username === username && admin.password === password
    )
    
    if (isValidAdmin) {
      // Set secure cookie for 7 days
      const response = NextResponse.json({
        success: true,
        message: 'Logged in successfully'
      })
      
      // Set authentication cookie
      response.cookies.set('admin_authenticated', 'true', {
        httpOnly: false, // Allow JavaScript access for client-side checking
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
      })
      
      // Set username cookie for tracking
      response.cookies.set('admin_username', username, {
        httpOnly: false, // Allow JavaScript access for client-side checking
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
      })
      
      return response
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  // Logout endpoint
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  })
  
  // Clear both cookies
  response.cookies.delete('admin_authenticated')
  response.cookies.delete('admin_username')
  
  return response
}