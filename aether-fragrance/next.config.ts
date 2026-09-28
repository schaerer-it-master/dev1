import type { NextConfig } from 'next';

// STATIC_EXPORT=1 produces a static build in ./out; `npm run export` additionally rewrites
// asset URLs to relative paths so the folder can be hosted from any sub-path.
const isStatic = process.env.STATIC_EXPORT === '1';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  ...(isStatic ? { output: 'export', distDir: 'out', images: { unoptimized: true } } : {}),
};

export default nextConfig;
