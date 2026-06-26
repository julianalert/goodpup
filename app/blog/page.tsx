import type { Metadata } from 'next';

import { siteConfig } from '@/app/_config/siteConfig';

import BlogList from './_components/BlogList';
import { getAllArticleSummaries, getArticles } from './_lib/outrank';
import { BLOG_ARTICLES_PER_PAGE } from './_lib/constants';
import { getPageParam } from './_lib/format';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Blog',
  description: siteConfig.blog.indexMetaDescription,
};

type Props = {
  searchParams: Promise<{
    page?: string;
  }>;
};

const BlogPage = async ({ searchParams }: Props) => {
  const resolvedSearchParams = await searchParams;
  const currentPage = getPageParam(resolvedSearchParams.page);
  const [{ articles, total_pages }, allArticles] = await Promise.all([
    getArticles({
      page: currentPage,
      limit: BLOG_ARTICLES_PER_PAGE,
    }),
    getAllArticleSummaries(),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 md:py-20">
      <header className="mx-auto mb-14 max-w-3xl text-center md:mb-16">
        <h1 className="text-4xl font-black leading-tight text-slate-950 md:text-6xl">
          {siteConfig.blog.indexTitle}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">{siteConfig.blog.indexDek}</p>
      </header>

      <BlogList
        paginatedArticles={articles}
        allArticles={allArticles}
        currentPage={currentPage}
        totalPages={total_pages}
      />
    </main>
  );
};

export default BlogPage;
