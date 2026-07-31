import type { NextConfig } from "next";

const pagesBasePath = process.env.PAGES_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: pagesBasePath,
  trailingSlash: true,
  images: { unoptimized: true },
  // The Lab is an interactive client application; never serve a bot-only shell.
  htmlLimitedBots: /$^/,
};

export default nextConfig;
