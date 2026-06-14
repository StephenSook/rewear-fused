import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mol* ships a large, deeply-nested module graph. Transpiling it through
  // Next's pipeline resolves the Turbopack "module factory not available"
  // runtime chunk error that otherwise crashes any page importing the viewer.
  transpilePackages: ["molstar"],
};

export default nextConfig;
