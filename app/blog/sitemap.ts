import type { MetadataRoute } from 'next';

import {
  BLOG_ARTICLE_SITEMAP_PRIORITY,
  BLOG_INDEX_SITEMAP_PRIORITY,
} from './_lib/constants';
import { getStaticArticles } from './_lib/outrank';
import { getPublishDate } from './_lib/format';
import { SITE_URL } from '@/lib/site';

export const revalidate = 86400;

const BASE_URL = SITE_URL;

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const siteUrl = BASE_URL;
  const articles = await getStaticArticles();

  return [
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: BLOG_INDEX_SITEMAP_PRIORITY,
    },
    ...articles.map((article) => ({
      url: `${siteUrl}/blog/${article.slug}`,
      lastModified: new Date(getPublishDate(article.slug, article.updated_at || article.created_at)),
      changeFrequency: 'daily' as const,
      priority: BLOG_ARTICLE_SITEMAP_PRIORITY,
    })),
  ];
};

export default sitemap;
