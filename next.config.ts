import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    GRAPHQL_URL: process.env.GRAPHQL_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "omekotitel.bg",
        port: "",
        pathname: "/pub/media/**",
      },
    ],
    // Only generate WebP — avif doubles transformations with negligible visual gain
    formats: ["image/webp"],
    // 31 days: product images rarely change, so skip re-transforming on every request
    minimumCacheTTL: 2678400,
    // Only allow the quality value actually used in the codebase (default 75)
    qualities: [75],
    // Covers fill-based grids at 1/2/3-column breakpoints (md=768, lg=1024)
    deviceSizes: [390, 640, 828, 1080, 1920],
    // Covers all fixed-width images: thumbnails(100), logo(190), list cards(200), product detail(600)
    imageSizes: [100, 200, 400, 600],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*.html",
        destination: "/:path*",
        permanent: true,
      },
      {
        source: "/product/:urlKey",
        destination: "/:urlKey",
        permanent: true,
      },
      {
        source: "/checkout",
        destination: "/onestepcheckout",
        permanent: true,
      },
      {
        source: "/checkout/success",
        destination: "/onestepcheckout/success",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/graphql",
        destination: "https://omekotitel.bg/graphql",
      },
    ];
  },
  turbopack: {
    rules: {
      "*.graphql": {
        loaders: ["graphql-tag/loader"],
        as: "*.js",
      },
    },
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.(graphql|gql)$/,
      exclude: /node_modules/,
      use: [
        {
          loader: "graphql-tag/loader",
        },
      ],
    });

    return config;
  },
};

export default nextConfig;
