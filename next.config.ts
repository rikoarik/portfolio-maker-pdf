import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["192.168.2.47"],
  /** Native libvips bindings must not be bundled; fixes Sharp/WebP on Vercel. */
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
