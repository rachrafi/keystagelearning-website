import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.keystagelearning.org',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
