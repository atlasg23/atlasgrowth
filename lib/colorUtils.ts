// Utility functions for working with colors and themes

// Predefined color schemes for quick customization
export const colorSchemes = {
  // Blues
  'ocean-blue': { primary: '#0EA5E9', secondary: '#F59E0B' },
  'navy-blue': { primary: '#1E40AF', secondary: '#059669' },
  'sky-blue': { primary: '#0284C7', secondary: '#DC2626' },
  
  // Reds
  'crimson-red': { primary: '#DC2626', secondary: '#059669' },
  'fire-red': { primary: '#EF4444', secondary: '#0EA5E9' },
  'cherry-red': { primary: '#B91C1C', secondary: '#F59E0B' },
  
  // Greens
  'forest-green': { primary: '#059669', secondary: '#DC2626' },
  'emerald-green': { primary: '#10B981', secondary: '#0EA5E9' },
  'sage-green': { primary: '#065F46', secondary: '#F59E0B' },
  
  // Oranges
  'sunset-orange': { primary: '#EA580C', secondary: '#0EA5E9' },
  'amber-orange': { primary: '#F59E0B', secondary: '#059669' },
  'burnt-orange': { primary: '#C2410C', secondary: '#1E40AF' },
  
  // Purples
  'royal-purple': { primary: '#7C3AED', secondary: '#F59E0B' },
  'deep-purple': { primary: '#5B21B6', secondary: '#059669' },
  'violet-purple': { primary: '#8B5CF6', secondary: '#DC2626' },
  
  // Professional/Corporate
  'professional-gray': { primary: '#475569', secondary: '#0EA5E9' },
  'corporate-black': { primary: '#1F2937', secondary: '#F59E0B' },
  'elegant-slate': { primary: '#334155', secondary: '#059669' },
}

// Helper function to convert hex to rgba
export function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

// Helper function to darken a color
export function darkenColor(hex: string, amount: number = 0.2): string {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount))
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount))
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// Helper function to lighten a color
export function lightenColor(hex: string, amount: number = 0.2): string {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * (1 + amount))
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * (1 + amount))
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * (1 + amount))
  const clamp = (val: number) => Math.min(255, Math.max(0, val))
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`
}

// Get a color scheme by name
export function getColorScheme(schemeName: string): { primary: string; secondary: string } | null {
  return colorSchemes[schemeName as keyof typeof colorSchemes] || null
}

// Get all available color scheme names
export function getAvailableSchemes(): string[] {
  return Object.keys(colorSchemes)
}