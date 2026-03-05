// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  site: 'https://eventarello.pages.dev',
  integrations: [react(), sitemap()],
  adapter: cloudflare(),
  vite: {
    plugins: [tailwindcss()],
  },
});
