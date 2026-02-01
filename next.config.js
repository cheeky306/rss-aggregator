/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@extractus/article-extractor'],
  },
};

module.exports = nextConfig;
