/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['static.usernames.app-backend.toolsforhumanity.com'],
  },
  experiments: {
    asyncWebAssembly: true,
  }
};

export default nextConfig;
