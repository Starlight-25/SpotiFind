/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lastfm.freetls.fastly.net",
      },
    ],
  },
};

export default nextConfig;
