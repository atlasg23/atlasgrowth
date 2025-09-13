const { resolveBusinessImages } = require('./lib/images.ts')

const testBusiness = {
  slug: 'test-business',
  business_type: 'plumbing',
  niche: 'plumbing',
  name: 'Test Plumbing Co'
}

console.log('Testing image resolution for:', testBusiness)
const images = resolveBusinessImages(testBusiness)
console.log('Resolved images:', images)