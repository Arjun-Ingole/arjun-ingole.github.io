// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://arjun-ingole.github.io',
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'houston' } }
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
