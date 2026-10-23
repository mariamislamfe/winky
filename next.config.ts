import type { NextConfig } from "next";

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Product photos are stored in Supabase Storage (public "products" bucket)
    remotePatterns: supabase
      ? [{ protocol: "https", hostname: supabase.hostname, pathname: "/storage/v1/object/public/products/**" }]
      : [],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Nobody can show the store inside their own site
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // Pin the root to this project so a stray lockfile in a parent folder isn't picked up.
    root: import.meta.dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
