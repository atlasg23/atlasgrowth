// Convert lead name to URL-friendly slug
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

// Extract business ID from slug (assumes format: name-id)
function extractIdFromSlug(slug) {
  const parts = slug.split('-')
  const lastPart = parts[parts.length - 1]
  
  // Check if last part looks like a UUID (8 chars)
  const uuidRegex = /^[a-f0-9]{8}$/
  if (uuidRegex.test(lastPart)) {
    return lastPart
  }
  
  return null
}

// Generate complete slug with ID suffix
function generateSlugWithId(name, id) {
  const baseSlug = createSlug(name)
  const shortId = id.split('-')[0] // Use first part of UUID
  return `${baseSlug}-${shortId}`
}

module.exports = { createSlug, extractIdFromSlug, generateSlugWithId }