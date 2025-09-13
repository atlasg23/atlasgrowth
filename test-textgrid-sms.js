require('dotenv').config({ path: '.env.local' })

async function testSendTemplateSMS() {
  const payload = {
    phone: '205-500-5170', // Your test number
    businessName: 'Test Business for Claude',
    businessSlug: 'test-business-claude',
    templateType: 'plumbing-pro'
  }

  console.log('📱 Testing TextGrid SMS with:', payload)

  try {
    // Test locally if running dev server, or use the API directly
    const response = await fetch('http://localhost:3000/api/send-template-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ SMS sent successfully!')
      console.log('Response:', result)
    } else {
      console.error('❌ Failed to send SMS:', result)
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\nTrying direct TextGrid API call...')
    
    // Fallback to direct API call
    const cleanPhone = payload.phone.replace(/\D/g, '')
    const formattedPhone = cleanPhone.startsWith('1') ? `+${cleanPhone}` : `+1${cleanPhone}`
    const templateUrl = `https://yourdomain.com/${payload.templateType}/${payload.businessSlug}`
    const message = `Hi ${payload.businessName}! Here's the custom website template I put together for your business: ${templateUrl}`

    const directResponse = await fetch('https://api.textgrid.com/send-message', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TEXTGRID_AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accountSid: process.env.TEXTGRID_ACCOUNT_SID,
        from: process.env.TEXTGRID_PHONE_2,
        to: formattedPhone,
        message: message
      })
    })

    if (directResponse.ok) {
      const result = await directResponse.json()
      console.log('✅ Direct TextGrid call succeeded:', result)
    } else {
      console.error('❌ Direct TextGrid call failed:', await directResponse.text())
    }
  }
}

testSendTemplateSMS().catch(console.error)