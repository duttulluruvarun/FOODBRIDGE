import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next infers the workspace root by walking up for lockfiles, and picks up an
  // unrelated one in the user's home directory. Pin it to this monorepo so the
  // build stops warning and resolves from the right place.
  turbopack: {
    root: path.join(__dirname, ".."),
  },
  experimental: {
    serverActions: {
      // Donation photos are submitted to the createDonation server action as
      // base64 data URLs (no object storage backend exists). A phone photo
      // easily exceeds the 1MB default, silently failing the submission.
      bodySizeLimit: "15mb",
    },
    // lucide-react and recharts are already optimized by default; framer-motion
    // (landing + tax-report pages) isn't, so only load the animation variants
    // actually imported instead of the whole library.
    optimizePackageImports: ["framer-motion"],
  },
};

export default nextConfig;
