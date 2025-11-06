// @ts-check
import { defineConfig } from 'astro/config';

import preact from "@astrojs/preact";

export default defineConfig({
  i18n: {
    defaultLocale: 'en',     // The default language used as a fallback
    locales: ['en', 'pt'],    // All supported languages on the site
    routing: {
      prefixDefaultLocale: false    
    }
  },
  site: "https://treeba.eu/",
  integrations: [preact()]
});


