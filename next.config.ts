import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Avatar uploads are limited to 2MB in the form/action layer.
      // Allow some multipart overhead so the request does not fail at 1MB first.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
