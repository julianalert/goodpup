import type { MetadataRoute } from 'next'
import { getAllBreedSlugs, getAllProblemSlugs, getAllBreedProblemPaths } from '@/lib/supabase-dogs'
import { SITE_URL } from '@/lib/site'

const BASE_URL = SITE_URL

export const revalidate = 86400

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [breedSlugs, problemSlugs, breedProblemPaths] = await Promise.all([
    getAllBreedSlugs(),
    getAllProblemSlugs(),
    getAllBreedProblemPaths(),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/dogs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/dog-food-calculator`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/dog-size-calculator`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/dog-bmi-calculator`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
  ]

  const breedRoutes: MetadataRoute.Sitemap = breedSlugs.flatMap((slug) => [
    {
      url: `${BASE_URL}/dogs/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/dogs/${slug}/training`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    },
    {
      url: `${BASE_URL}/dogs/${slug}/problems`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    },
    {
      url: `${BASE_URL}/dogs/${slug}/daily-life`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    },
  ])

  const problemRoutes: MetadataRoute.Sitemap = problemSlugs.map((slug) => ({
    url: `${BASE_URL}/dogs/problems/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const breedProblemRoutes: MetadataRoute.Sitemap = breedProblemPaths.map((p) => ({
    url: `${BASE_URL}/dogs/${p.breed_slug}/${p.problem_slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...breedRoutes, ...problemRoutes, ...breedProblemRoutes]
}
