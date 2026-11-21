// Import the glob loader
import { glob } from "astro/loaders";
// Import utilities from `astro:content`
import { z, defineCollection } from "astro:content";
// Define a `loader` and `schema` for each collection
const blog = defineCollection({
    loader: glob({ pattern: '[^_]*.md', base: "src/blog" }),
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
// Export a single `collections` object to register your collection(s)
export const collections = { blog };