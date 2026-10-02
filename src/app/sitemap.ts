import type { MetadataRoute } from 'next'
import { SITE } from '@/content/site'

// Uma rota pública só (`/`); as rotas de `/dev` dão 404 em produção e ficam de fora.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE.url, changeFrequency: 'monthly', priority: 1 }]
}
