import { defineConfig } from 'astro/config';
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: 'https://www.keystagelearning.org',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Hosted on Cloudflare. Every page is still pre-built; pages that need a login
  // (account, paid videos) will opt out with `export const prerender = false`.
  // Images are already sized, so no Cloudflare Images service is needed.
  adapter: cloudflare({ imageService: "passthrough" }),
});
