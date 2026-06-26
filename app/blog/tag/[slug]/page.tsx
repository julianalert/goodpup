import Link from 'next/link';
import type { Metadata } from 'next';

import { siteConfig } from '@/app/_config/siteConfig';
import ArticleCard from '../../_components/ArticleCard';
import Pagination from '../../_components/Pagination';
import { getArticles, getStaticArticles } from '../../_lib/outrank';
import { BLOG_ARTICLES_PER_PAGE, BLOG_TAG_EAGER_IMAGE_LIMIT } from '../../_lib/constants';
import { getPageParam } from '../../_lib/format';
import s from '../../blog.module.css';

export const revalidate = 86400;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export const generateStaticParams = async () => {
  const articles = await getStaticArticles();
  const tags = new Set(articles.flatMap((a) => a.tags));
  return Array.from(tags).map((tag) => ({ slug: encodeURIComponent(tag) }));
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const resolvedParams = await params;
  const tag = decodeURIComponent(resolvedParams.slug);
  return { title: `#${tag}`, description: `Articles tagged with ${tag}.` };
};

const TagPage = async ({ params, searchParams }: Props) => {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const currentPage = getPageParam(resolvedSearchParams.page);
  const tag = decodeURIComponent(resolvedParams.slug);
  const { articles, total, total_pages } = await getArticles({ page: currentPage, limit: BLOG_ARTICLES_PER_PAGE, tag });

  return (
    <main className={s.tagPage}>
      <Link href="/blog" className={s.backLink}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
        {siteConfig.blog.allArticles}
      </Link>

      <div className={s.tagHeader}>
        <p className={s.eyebrow}>{siteConfig.blog.tagEyebrow}</p>
        <div>
          <h1 className={s.tagTitle}>#{tag}</h1>
          <span className={s.tagCount}>{total} {total === 1 ? 'article' : 'articles'}</span>
        </div>
      </div>

      {articles.length ? (
        <div className={s.grid}>
          {articles.map((article, index) => (
            <ArticleCard key={article.id} article={article} imageLoading={index < BLOG_TAG_EAGER_IMAGE_LIMIT ? 'eager' : 'lazy'} />
          ))}
        </div>
      ) : (
        <div className={s.emptyGrid}>{siteConfig.blog.emptyState}</div>
      )}

      <Pagination basePath={`/blog/tag/${encodeURIComponent(tag)}`} currentPage={currentPage} totalPages={total_pages} />
    </main>
  );
};

export default TagPage;
