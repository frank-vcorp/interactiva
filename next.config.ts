import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "@node-rs/argon2"],
  experimental: {
    // Catálogos completos (EBC/Lobato) llegan a ~380 MB.
    middlewareClientMaxBodySize: "400mb",
    // Next 15.5+ standalone proxy limit (types lag behind runtime).
    ...({ proxyClientMaxBodySize: "400mb" } as Record<string, string>),
  },
};

export default nextConfig;
