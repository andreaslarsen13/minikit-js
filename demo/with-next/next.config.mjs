/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['static.usernames.app-backend.toolsforhumanity.com'],
  },
  // Add the ngrok URL as a trusted host
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.ngrok-free.app",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
