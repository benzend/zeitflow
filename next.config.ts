import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['qki0mqoifs86lfat.public.blob.vercel-storage.com'],
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
