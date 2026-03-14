/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true,
    domains: ['i.imgur.com', 'imagedelivery.net', 'pbs.twimg.com'],
  },
}

module.exports = nextConfig
