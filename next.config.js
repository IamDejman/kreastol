/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Allow production builds to successfully complete even if
    // there are TypeScript errors in the project or dependencies.
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
