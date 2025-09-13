#!/usr/bin/env node

// Test GoHighLevel with full contact data for proper field mapping

async function testFullData() {
  console.log('🧪 Testing GoHighLevel with FULL contact data for field mapping...\n')
  
  const fullPayload = {
    business_name: "ABC Plumbing Services",
    business_phone: "504-555-0123", 
    owner_name: "John Smith",
    owner_email: "john@abcplumbing.com",
    notes: "Interested in emergency repair services. Called back immediately when we reached out. Very responsive and asked about our 24/7 availability."
  }
  
  console.log('📤 Sending FULL payload for GoHighLevel field mapping:')
  console.log(JSON.stringify(fullPayload, null, 2))
  console.log('\n' + '='.repeat(60))
  
  try {
    const response = await fetch('http://localhost:3000/api/send-to-ghl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fullPayload)
    })
    
    const result = await response.json()
    
    console.log('📨 Status:', response.status)
    console.log('📨 Response:', JSON.stringify(result, null, 2))
    
    if (response.ok && result.ghlContact.success) {
      console.log('\n✅ SUCCESS: Full data sent to GoHighLevel!')
      console.log('📋 GoHighLevel received:')
      console.log('   • Business Name:', fullPayload.business_name)
      console.log('   • Business Phone:', fullPayload.business_phone) 
      console.log('   • Owner Name:', fullPayload.owner_name)
      console.log('   • Owner Email:', fullPayload.owner_email)
      console.log('   • Notes:', fullPayload.notes.substring(0, 50) + '...')
      console.log('\n🎯 This should help GoHighLevel map all your contact fields properly!')
    } else {
      console.log('\n❌ FAILED:', result.error)
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message)
  }
  
  console.log('\n🎉 Full data test complete!')
}

testFullData().catch(console.error)