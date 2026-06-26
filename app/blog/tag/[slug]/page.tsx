import Link from 'next/link';
import type { Metadata } from 'next';

import { siteConfig } from '@/app/_config/siteConfig';

import ArticleCard from '../../_components/ArticleCard';
import Pagination from '../../_components/Pagination';
import { getArticles, getStaticArticles } from '../../_lib/outrank';
import { BLOG_ARTICLES_PER_PAGE, BLOG_TAG_EAGER_IMAGE_LIMIT } from '../../_lib/constants';
import { getPageParam } from '../../_lib/format';

export const revalidate = 86400;

type Props = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
};

export const generateStaticParams = async () => {
  const articles = await getStaticArticles();
  const tags = new Set(articles.flatMap((article) => article.tags));

  return Array.from(tags).map((tag) => ({
    slug: encodeURIComponent(tag),
  }));
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const resolvedParams = await params;
  const tag = decodeURIComponent(resolvedParams.slug);

  return {
    title: `#${tag}`,
    description: `Articles tagged with ${tag}.`,
  };
};

const TagPage = async ({ params, searchParams }: Props) => {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const currentPage = getPageParam(resolvedSearchParams.page);
  const tag = decodeURIComponent(resolvedParams.slug);
  const { articles, total, total_pages } = await getArticles({
    page: currentPage,
    limit: BLOG_ARTICLES_PER_PAGE,
    tag,
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-16 pb-10 md:pt-24 md:pb-16">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 underline-offset-4 transition hover:text-slate-950 hover:underline"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        {siteConfig.blog.allArticles}
      </Link>

      <header className="mt-8 mb-12 max-w-5xl">
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
          <h1 className="text-4xl font-black leading-tight text-slate-950 md:text-6xl">#{tag}</h1>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">
            {total} {total === 1 ? 'article' : 'articles'}
          </p>
        </div>
      </header>

      {articles.length ? (
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => (
            <ArticleCard
              key={article.id}
              article={article}
              imageLoading={index < BLOG_TAG_EAGER_IMAGE_LIMIT ? 'eager' : 'lazy'}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          {siteConfig.blog.emptyState}
        </div>
      )}

      <Pagination
        basePath={`/blog/tag/${encodeURIComponent(tag)}`}
        currentPage={currentPage}
        totalPages={total_pages}
      />
    </main>
  );
};

export default TagPage;
