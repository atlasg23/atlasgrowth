// Convert lead name to URL-friendly slug
export function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

// Extract business ID from slug (assumes format: name-id)
export function extractIdFromSlug(slug: string): string | null {
  const parts = slug.split('-')
  const lastPart = parts[parts.length - 1]
  
  // Check if last part looks like a UUID (8-4-4-4-12 pattern)
  const uuidRegex = /^[a-f0-9]{8}$/
  if (uuidRegex.test(lastPart)) {
    return lastPart
  }
  
  return null
}

// Generate complete slug with ID suffix
export function generateSlugWithId(name: string, id: string): string {
  const baseSlug = createSlug(name)
  const shortId = id.split('-')[0] // Use first part of UUID
  return `${baseSlug}-${shortId}`
}