import type { NextConfig } from "next";

import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  // Headless Chrome for page screenshots: loaded as is at run time, never bundled.
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  // Its compressed Chrome files are read from disk at run time, so they must be packed with the routes that use them.
  outputFileTracingIncludes: {
    '/api/save': ['./node_modules/@sparticuz/chromium/bin/**'],
    '/api/bookmarks/[id]/preview': ['./node_modules/@sparticuz/chromium/bin/**'],
    '/api/admin/preview-check': ['./node_modules/@sparticuz/chromium/bin/**'],
    '/api/admin/preview-backfill': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
};

export default nextConfig;
