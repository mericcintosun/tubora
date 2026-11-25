import fs from "fs";
import path from "path";
import type { NextConfig } from "next";

// Uploaded brand images (public/brand/*.png) are listed once, at build time, so that
// components can choose between an uploaded image and its SVG fallback without touching
// the file system at request time (public/ is not readable inside a serverless function).
const brandDir = path.join(process.cwd(), "public", "brand");
const brandFiles = fs.existsSync(brandDir)
  ? fs
      .readdirSync(brandDir)
      .filter((f) => f.endsWith(".png"))
      .map((f) => f.slice(0, -4))
  : [];

const nextConfig: NextConfig = {
  // Pins every /_next/static request to the deployment that rendered the HTML (?dpl=), so a page
  // served during or after a redeploy never asks the new deployment for the old build's chunks.
  deploymentId: process.env.VERCEL_DEPLOYMENT_ID || undefined,
  env: { NEXT_PUBLIC_BRAND_FILES: brandFiles.join(",") },
};

export default nextConfig;
