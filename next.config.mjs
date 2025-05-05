/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
      return [
        {
          source: '/api/:path*', // Match any path starting with /api/
          destination: 'https://quicknote-api.fly.dev/api/:path*', // Proxy to FastAPI backend
          // destination: 'http://localhost:8000/api/:path*', // Proxy to FastAPI backend
        },
      ];
    },
  };
  export default nextConfig;