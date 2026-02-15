import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://0.0.0.0:3000',
    'http://21.0.0.184:3000',
    'localhost',
    '0.0.0.0',
    '21.0.0.184',
  ],
};

export default nextConfig;
