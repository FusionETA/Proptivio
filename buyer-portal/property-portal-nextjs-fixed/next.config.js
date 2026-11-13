/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/buyer',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fusion.bitrix24.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
