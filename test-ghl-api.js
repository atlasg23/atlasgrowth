#!/usr/bin/env node

// Test the /api/send-to-ghl endpoint with different business scenarios

const testCases = [
  {
    name: "Test 1 - Full data",
    payload: {
      owner_name: "John Smith",
      owner_email: "john@example.com", 
      owner_phone: "555-123-4567",
      notes: "Interested in plumbing services",
      business_name: "ABC Plumbing Co"
    }
  },
  {
    name: "Test 2 - Minimal data (business + phone only)",
    payload: {
      owner_phone: "555-987-6543",
      business_name: "XYZ HVAC Services"
    }
  },
  {
    name: "Test 3 - Business + phone + notes",
    payload: {
      owner_phone: "555-555-5555",
      business_name: "Quick Fix Plumbing",
      notes: "Called about emergency repair"
    }
  },
  {
    name: "Test 4 - Should fail (missing business name)",
    payload: {
      owner_name: "Jane Doe",
      owner_phone: "555-111-2222"
    }
  }
]

async function testAPI() {
  console.log('🧪 Testing GoHighLevel API endpoint...\n')
  
  for (const test of testCases) {
    console.log(`\n📋 ${test.name}`)
    console.log('📤 Payload:', JSON.stringify(test.payload, null, 2))
    
    try {
      const response = await fetch('http://localhost:3000/api/send-to-ghl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(test.payload)
      })
      
      const result = await response.json()
      
      console.log('📨 Status:', response.status)
      console.log('📨 Response:', JSON.stringify(result, null, 2))
      
      if (response.ok) {
        console.log('✅ Test passed')
      } else {
        console.log('❌ Test failed as expected')
      }
      
    } catch (error) {
      console.error('❌ Request failed:', error.message)
    }
    
    console.log('-'.repeat(50))
  }
  
  console.log('\n🎉 API testing complete!')
}

testAPI().catch(console.error)