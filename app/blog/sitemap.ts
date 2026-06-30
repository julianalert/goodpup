import type { MetadataRoute } from 'next';

import {
  BLOG_ARTICLE_SITEMAP_PRIORITY,
  BLOG_INDEX_SITEMAP_PRIORITY,
} from './_lib/constants';
import { getStaticArticles } from './_lib/outrank';

export const revalidate = 86400;

const BASE_URL = 'https://mypawcraft.com';

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
      lastModified: new Date(article.updated_at || article.created_at),
      changeFrequency: 'daily' as const,
      priority: BLOG_ARTICLE_SITEMAP_PRIORITY,
    })),
  ];
};

export default sitemap;
