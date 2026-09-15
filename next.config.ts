import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "@node-rs/argon2"],
  experimental: {
    // Catálogos completos (EBC/Lobato) llegan a ~380 MB.
    middlewareClientMaxBodySize: "400mb",
  },
  serverActions: {
    bodySizeLimit: "400mb",
  },
};

export default nextConfig;
