/** @type {import('next').NextConfig} */

const apiHostname = new URL(process.env.API_BASE_URL).hostname;

const nextConfig = {
  env: {
    API_BASE_URL: process.env.API_BASE_URL,
    REVERSE_PROXY_URL: process.env.REVERSE_PROXY_URL,
    API42_CLIENT_ID: process.env.API42_CLIENT_ID,
    API_GITHUB_CLIENT_ID: process.env.API_GITHUB_CLIENT_ID,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.intra.42.fr/**",
      },
      {
        protocol: "http",
        hostname: apiHostname,
      },
    ],
  },
};

module.exports = nextConfig;
