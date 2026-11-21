import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    slug: z.string().optional(),
    title: z.string(),
    startDate: z.date(),
    lastUpdated: z.date(),
    successionStage: z.string(),
    growthStage: z.string(),
    strataLevel: z.string(),
    format: z.string(),
    draft: z.boolean().default(true),
    topics: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    description: z.string(),
    image: z.object({
      url: z.string(),
      alt: z.string()
    })
  })
});

export const collections = { blog };
