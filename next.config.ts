import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Frozen when `next build` loads this file, so sitemap lastmod is not the request time.
    SITEMAP_BUILD_DATE: new Date().toISOString(),
  },
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
};

export default nextConfig;
