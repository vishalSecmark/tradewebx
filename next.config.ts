import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/apps",
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/apps",
        permanent: true, // Set to true for a 308 redirect, false for a 307 redirect
      },
    ];
  },
};

export default nextConfig;
