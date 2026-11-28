// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import preact from "@astrojs/preact";
import { unified } from "@astrojs/markdown-remark";
import { remarkModifiedTime } from "./remark-modified-time.mjs";

import netlify from '@astrojs/netlify';

export default defineConfig({
  markdown: {
    processor: unified({
      remarkPlugins: [remarkModifiedTime],
    }),
  },

  i18n: {
    defaultLocale: 'en',     // The default language used as a fallback
    locales: ['en', 'pt'],    // All supported languages on the site
    routing: {
      prefixDefaultLocale: false    
    }
  },

  site: "https://treeba.eu/",
  integrations: [mdx(), preact()]
});