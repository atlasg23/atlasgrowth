import React from 'react'

interface ThemeProviderProps {
  primaryColor?: string
  secondaryColor?: string
  children: React.ReactNode
}

export function ThemeProvider({ primaryColor = '#0EA5E9', secondaryColor = '#F59E0B', children }: ThemeProviderProps) {
  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  // Helper function to darken a color
  const darkenColor = (hex: string, amount: number = 0.2) => {
    const r = Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount))
    const g = Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount))
    const b = Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount))
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  const themeStyles = {
    '--primary-color': primaryColor,
    '--secondary-color': secondaryColor,
    '--primary-50': hexToRgba(primaryColor, 0.05),
    '--primary-100': hexToRgba(primaryColor, 0.1),
    '--primary-600': primaryColor,
    '--primary-700': darkenColor(primaryColor, 0.15),
    '--primary-800': darkenColor(primaryColor, 0.3),
    '--secondary-50': hexToRgba(secondaryColor, 0.05),
    '--secondary-100': hexToRgba(secondaryColor, 0.1),
    '--secondary-600': secondaryColor,
    '--secondary-700': darkenColor(secondaryColor, 0.15),
  } as React.CSSProperties

  return (
    <div style={themeStyles}>
      {children}
    </div>
  )
}