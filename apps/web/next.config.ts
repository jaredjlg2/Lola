import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@lola/shared', '@lola/voice']
};

export default nextConfig;
