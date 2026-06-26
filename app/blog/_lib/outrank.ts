import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { BlogClient, type Article, type ArticleSummary } from 'outrank-next-js-blog';

import {
  BLOG_ARTICLES_PER_PAGE,
  BLOG_ARTICLES_REQUEST_ERROR,
  BLOG_ARTICLE_REQUEST_ERROR,
  BLOG_ALL_ARTICLES_REQUEST_ERROR,
  BLOG_DEFAULT_PAGE,
  BLOG_RELATED_ARTICLES_DEFAULT_LIMIT,
  BLOG_REVALIDATE_SECONDS,
  BLOG_SITEMAP_PAGE_SIZE,
  OUTRANK_API_KEY_PLACEHOLDER,
  OUTRANK_ENV_ERROR_PATTERN,
} from './constants';
import { getAllMockArticles, getMockArticle, getMockArticlesResponse } from './mockArticles';

type GetArticlesParams = {
  page?: number;
  limit?: number;
  tag?: string;
};

type StaticArticle = Pick<ArticleSummary, 'created_at' | 'slug' | 'tags' | 'updated_at'>;

const isDemoMode = (): boolean => {
  const apiKey = process.env.OUTRANK_BLOG_API_KEY;
  return !apiKey || apiKey === OUTRANK_API_KEY_PLACEHOLDER;
};

const getOutrankApiKey = () => {
  const apiKey = process.env.OUTRANK_BLOG_API_KEY;

  if (!apiKey) {
    throw new Error('OUTRANK_BLOG_API_KEY is not set');
  }

  return apiKey;
};

const OUTRANK_API_BASE_URL = 'https://outrank.so';

const getClient = cache(
  () =>
    new BlogClient(getOutrankApiKey(), {
      baseUrl: OUTRANK_API_BASE_URL,
    }),
);

const isOutrankConfigurationError = (error: unknown): boolean =>
  error instanceof Error && error.message.includes(OUTRANK_ENV_ERROR_PATTERN);

const runOutrankRequest = async <Response>(
  request: () => Promise<Response>,
  errorMessage: string,
): Promise<Response> => {
  try {
    return await request();
  } catch (error) {
    if (isOutrankConfigurationError(error)) {
      throw error;
    }

    throw new Error(errorMessage);
  }
};

const getArticlesByParams = unstable_cache(
  async (page: number, limit: number, tag: string) => {
    if (isDemoMode()) {
      return getMockArticlesResponse(page, limit, tag);
    }

    const client = getClient();

    return runOutrankRequest(
      () => (tag ? client.getTagArticles(tag, page, limit) : client.getArticles(page, limit)),
      BLOG_ARTICLES_REQUEST_ERROR,
    );
  },
  ['outrank-blog-articles'],
  { revalidate: BLOG_REVALIDATE_SECONDS },
);

export const getArticles = async ({
  page = BLOG_DEFAULT_PAGE,
  limit = BLOG_ARTICLES_PER_PAGE,
  tag,
}: GetArticlesParams = {}) => {
  return getArticlesByParams(page, limit, tag || '');
};

export const getArticle = unstable_cache(
  async (slug: string): Promise<Article | null> => {
    if (isDemoMode()) {
      return getMockArticle(slug);
    }

    return runOutrankRequest(() => getClient().getArticle(slug), BLOG_ARTICLE_REQUEST_ERROR);
  },
  ['outrank-blog-article'],
  { revalidate: BLOG_REVALIDATE_SECONDS },
);

const getStaticArticlesByParams = unstable_cache(
  async (): Promise<StaticArticle[]> => {
    if (isDemoMode()) {
      return getAllMockArticles().map(({ created_at, slug, tags, updated_at }) => ({
        created_at,
        slug,
        tags,
        updated_at,
      }));
    }

    const articles = await runOutrankRequest(
      () => getClient().getAllArticles(BLOG_SITEMAP_PAGE_SIZE),
      BLOG_ALL_ARTICLES_REQUEST_ERROR,
    );

    return articles.map(({ created_at, slug, tags, updated_at }) => ({
      created_at,
      slug,
      tags,
      updated_at,
    }));
  },
  ['outrank-blog-static-articles'],
  { revalidate: BLOG_REVALIDATE_SECONDS },
);

export const getStaticArticles = async (): Promise<StaticArticle[]> => {
  try {
    return await getStaticArticlesByParams();
  } catch (error) {
    if (isOutrankConfigurationError(error)) {
      throw error;
    }

    return [];
  }
};

const toArticleSummary = ({
  id,
  title,
  slug,
  meta_description,
  image_url,
  tags,
  created_at,
  updated_at,
  reading_time_minutes,
}: Article): ArticleSummary => ({
  id,
  title,
  slug,
  meta_description,
  image_url,
  tags,
  created_at,
  updated_at,
  reading_time_minutes,
});

const getAllArticleSummariesCached = unstable_cache(
  async (): Promise<ArticleSummary[]> => {
    if (isDemoMode()) {
      return getAllMockArticles().map(toArticleSummary);
    }

    return runOutrankRequest(
      () => getClient().getAllArticles(BLOG_SITEMAP_PAGE_SIZE),
      BLOG_ALL_ARTICLES_REQUEST_ERROR,
    );
  },
  ['outrank-blog-all-summaries'],
  { revalidate: BLOG_REVALIDATE_SECONDS },
);

export const getAllArticleSummaries = async (): Promise<ArticleSummary[]> => {
  try {
    return await getAllArticleSummariesCached();
  } catch (error) {
    if (isOutrankConfigurationError(error)) {
      throw error;
    }

    return [];
  }
};

const sortByCreatedAtDesc = (a: ArticleSummary, b: ArticleSummary): number =>
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

export const getRelatedArticles = async (
  currentSlug: string,
  currentTags: string[],
  limit: number = BLOG_RELATED_ARTICLES_DEFAULT_LIMIT,
): Promise<ArticleSummary[]> => {
  const all = await getAllArticleSummaries();
  const candidates = all.filter((article) => article.slug !== currentSlug);
  if (candidates.length === 0) return [];

  const currentTagSet = new Set(currentTags);

  const scored = candidates
    .map((article) => ({
      article,
      overlap: article.tags.reduce((count, tag) => (currentTagSet.has(tag) ? count + 1 : count), 0),
    }))
    .filter(({ overlap }) => overlap > 0)
    .sort((a, b) => {
      if (b.overlap !== a.overlap) return b.overlap - a.overlap;
      return sortByCreatedAtDesc(a.article, b.article);
    });

  const related: ArticleSummary[] = scored.slice(0, limit).map(({ article }) => article);

  if (related.length < limit) {
    const usedSlugs = new Set(related.map((article) => article.slug));
    const filler = candidates
      .filter((article) => !usedSlugs.has(article.slug))
      .sort(sortByCreatedAtDesc)
      .slice(0, limit - related.length);
    related.push(...filler);
  }

  return related;
};
