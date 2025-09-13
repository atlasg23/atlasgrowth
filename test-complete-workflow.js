#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' })

async function testCompleteWorkflow() {
  console.log('🚀 Testing Complete Template Workflow\n')
  console.log('='.repeat(50))
  
  // Step 1: Test TextGrid SMS sending
  console.log('\n📱 Step 1: Sending template via TextGrid SMS...')
  
  const accountSid = process.env.TEXTGRID_ACCOUNT_SID
  const authToken = process.env.TEXTGRID_AUTH_TOKEN
  const fromPhone = process.env.TEXTGRID_PHONE_2
  const toPhone = '+12055005170' // Your test number
  
  const templateUrl = 'http://localhost:3000/plumbing-pro/test-business-claude'
  const message = `Hi Test Business! Here's the custom website template I put together for your business: ${templateUrl}`
  
  // Create base64 auth
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
  
  try {
    const response = await fetch(
      `https://api.textgrid.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          From: fromPhone,
          To: toPhone,
          Body: message
        })
      }
    )
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ SMS sent successfully!')
      console.log('Message ID:', result.sid)
      console.log('Status:', result.status)
    } else {
      const error = await response.text()
      console.error('❌ TextGrid error:', error)
    }
  } catch (error) {
    console.error('❌ Failed to send SMS:', error.message)
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('\n📊 What happens next:')
  console.log('1. You receive SMS at 205-500-5170')
  console.log('2. Click the template link in the SMS')
  console.log('3. Template view is tracked with:')
  console.log('   - IP address (server-side)')
  console.log('   - Session fingerprint')
  console.log('   - Unique visitor detection')
  console.log('   - Time on page tracking')
  console.log('   - Interaction counting')
  console.log('4. GoHighLevel webhook fires for unique visitors')
  console.log('5. Database stores all analytics data')
  
  console.log('\n🔍 Check tracking data:')
  console.log(`psql "$SUPABASE_DB_URL" -c "SELECT * FROM template_views WHERE business_slug = 'test-business-claude';"`)
  
  console.log('\n✨ Complete workflow test ready!')
}

testCompleteWorkflow().catch(console.error)