import type { MetadataRoute } from 'next'

const BASE_URL = 'https://curatedreels.com'

const routes = [
  '/',
  '/about',
  '/business',
  '/demo',
  '/contact',
  '/pricing',
  '/privacy',
  '/terms',
]

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : 0.8,
  }))
}
