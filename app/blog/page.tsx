import type { Metadata } from 'next';

import { siteConfig } from '@/app/_config/siteConfig';
import BlogList from './_components/BlogList';
import { getAllArticleSummaries, getArticles } from './_lib/outrank';
import { BLOG_ARTICLES_PER_PAGE } from './_lib/constants';
import { getPageParam, sortByPublishDateDesc } from './_lib/format';
import s from './blog.module.css';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Blog',
  description: siteConfig.blog.indexMetaDescription,
};

type Props = {
  searchParams: Promise<{ page?: string }>;
};

const BlogPage = async ({ searchParams }: Props) => {
  const resolvedSearchParams = await searchParams;
  const currentPage = getPageParam(resolvedSearchParams.page);
  const [{ articles: rawArticles, total_pages }, rawAllArticles] = await Promise.all([
    getArticles({ page: currentPage, limit: BLOG_ARTICLES_PER_PAGE }),
    getAllArticleSummaries(),
  ]);

  const articles = [...rawArticles].sort(sortByPublishDateDesc);
  const allArticles = [...rawAllArticles].sort(sortByPublishDateDesc);

  return (
    <main className={s.page}>
      <header className={s.pageHeader}>
        <span className={s.eyebrow}>{siteConfig.blog.indexEyebrow}</span>
        <h1 className={s.pageTitle}>{siteConfig.blog.indexTitle}</h1>
        <p className={s.pageDek}>{siteConfig.blog.indexDek}</p>
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
