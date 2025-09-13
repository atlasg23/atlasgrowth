#!/usr/bin/env node

// Test script to verify GoHighLevel webhook URL is working

const testPayload = {
  firstName: "John",
  lastName: "Doe", 
  email: "john@test.com",
  phone: "555-123-4567",
  companyName: "Test Plumbing Co",
  city: "New Orleans",
  state: "Louisiana",
  leadId: "test123",
  businessType: "plumbing",
  templateType: "plumbing-pro",
  templateUrl: "https://example.com/plumbing-pro/testslug",
  leadStatus: "template_sent",
  leadSource: "CRM Dashboard",
  slug: "testslug",
  fullAddress: "123 Test St, New Orleans, LA",
  verifiedBusiness: true,
  rating: "4.5",
  reviews: "25",
  dateSent: new Date().toISOString(),
  dateViewed: null,
  customFields: {
    template_url: "https://example.com/plumbing-pro/testslug",
    business_slug: "testslug",
    template_type: "plumbing-pro",
    business_rating: "4.5",
    business_reviews: "25",
    verified_business: true
  }
}

console.log('🚀 Testing GoHighLevel webhook...')
console.log('📤 Payload:', JSON.stringify(testPayload, null, 2))

const webhookUrl = 'https://services.leadconnectorhq.com/hooks/QNmjjiQF2UwCdleDDkO7/webhook-trigger/334aeeab-28ad-4d95-8eeb-153cf690d554'

fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testPayload)
})
.then(response => {
  console.log('📨 Response Status:', response.status)
  console.log('📨 Response Headers:', Object.fromEntries(response.headers.entries()))
  return response.text()
})
.then(text => {
  console.log('📨 Response Body:', text)
  console.log('✅ Webhook test complete')
})
.catch(error => {
  console.error('❌ Webhook test failed:', error)
})