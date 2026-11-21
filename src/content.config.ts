import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    slug: z.string().optional(),
    title: z.string(),
    startDate: z.date(),
    lastUpdated: z.date(),
    successionStage: z.string(),
    growthStage: z.string(),
    stataLevel: z.string(),
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
