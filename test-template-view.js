#!/usr/bin/env node

async function testTemplateView() {
  console.log('🧪 Testing template view tracking...\n')
  
  // Test with your test lead
  const payload = {
    business_slug: 'test-business-claude',
    template_type: 'plumbing-pro',
    user_agent: 'Mozilla/5.0 Test Browser',
    referrer: 'https://sms-link.com',
    session_id: 'test-session-123',
    page_loaded_at: new Date().toISOString()
  }
  
  console.log('📤 Sending test view:', payload)
  
  try {
    const response = await fetch('http://localhost:3000/api/track-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.100'
      },
      body: JSON.stringify(payload)
    })
    
    const result = await response.json()
    console.log('\n📥 Response:', result)
    
    if (result.success) {
      console.log('\n✅ View tracked successfully!')
      console.log('View ID:', result.view_id)
      console.log('Is unique:', result.is_unique)
      
      console.log('\n🔍 Check server logs for:')
      console.log('- Lead lookup result')
      console.log('- GHL webhook payload')
      console.log('- GHL webhook response')
      
      console.log('\n💡 If GHL didn\'t receive it, check:')
      console.log('1. Is the lead in the database?')
      console.log('2. Does the lead have a phone number?')
      console.log('3. Is the webhook URL correct?')
    } else {
      console.error('\n❌ Failed:', result)
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.log('\nMake sure the dev server is running: npm run dev')
  }
}

testTemplateView().catch(console.error)