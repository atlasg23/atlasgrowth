/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove export mode - use standard Next.js server
  trailingSlash: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      }
    ]
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/out/**",
          "**/attached_assets/**", 
          "**/data/outscraper-imports/**",
          "**/node_modules/**"
        ]
      }
    }
    return config
  }
}

module.exports = nextConfig
