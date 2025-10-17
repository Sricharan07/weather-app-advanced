/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['openweathermap.org'],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  // Disable static optimization for API routes to prevent build-time errors
  output: 'standalone',
  // Ensure API routes are not pre-rendered
  trailingSlash: false,
}

module.exports = nextConfig
