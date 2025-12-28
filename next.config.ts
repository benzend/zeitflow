import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    mdxRs: true, // Enable MDX Rust compiler for better performance
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qki0mqoifs86lfat.public.blob.vercel-storage.com',
        pathname: '/**',
      },
    ],
    domains: ['localhost'], // Keep for local development
  },
  async headers() {
    return [
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
