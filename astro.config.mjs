// @ts-check
import { defineConfig } from 'astro/config';

import vercel from '@astrojs/vercel';

const site = process.env.SITE_URL;

// https://astro.build/config
export default defineConfig({
  site,
  output: 'server',
  adapter: vercel()
});
