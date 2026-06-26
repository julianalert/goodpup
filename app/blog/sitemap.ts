import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

import {
  BLOG_ARTICLE_SITEMAP_PRIORITY,
  BLOG_INDEX_SITEMAP_PRIORITY,
  FORWARDED_PROTO_HEADER,
  HOST_HEADER,
  HTTP_PROTOCOL,
  HTTPS_PROTOCOL,
  LOCALHOST_HOST_PREFIX,
  SITE_URL_FALLBACK,
} from './_lib/constants';
import { getStaticArticles } from './_lib/outrank';

export const revalidate = 86400;

const getSiteUrl = async () => {
  const requestHeaders = await headers();
  const host = requestHeaders.get(HOST_HEADER);

  if (!host) {
    return SITE_URL_FALLBACK;
  }

  const protocol =
    requestHeaders.get(FORWARDED_PROTO_HEADER) ||
    (host.startsWith(LOCALHOST_HOST_PREFIX) ? HTTP_PROTOCOL : HTTPS_PROTOCOL);

  return `${protocol}://${host}`.replace(/\/$/, '');
};

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const siteUrl = await getSiteUrl();
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
