import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { siteConfig } from '@/app/_config/siteConfig';

import ArticleSidebar from '../_components/ArticleSidebar';
import BackToTop from '../_components/BackToTop';
import RelatedArticles from '../_components/RelatedArticles';
import styles from '../_components/ArticleContent.module.css';
import { getArticle, getRelatedArticles, getStaticArticles } from '../_lib/outrank';
import { formatDate } from '../_lib/format';
import { ensureHeadingIds } from '../_lib/toc';

export const revalidate = 86400;

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export const generateStaticParams = async () => {
  const articles = await getStaticArticles();

  return articles.map((article) => ({
    slug: article.slug,
  }));
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const resolvedParams = await params;
  const article = await getArticle(resolvedParams.slug);

  if (!article) {
    return {
      title: 'Article not found',
    };
  }

  return {
    title: article.title,
    description: article.meta_description,
    openGraph: {
      title: article.title,
      description: article.meta_description,
      images: article.image_url ? [{ url: article.image_url }] : undefined,
    },
  };
};

const ArticlePage = async ({ params }: Props) => {
  const resolvedParams = await params;
  const article = await getArticle(resolvedParams.slug);

  if (!article) {
    notFound();
  }

  const { html: articleHtml, tocItems } = ensureHeadingIds(article.html);
  const hasTableOfContents = tocItems.length > 0;
  const relatedArticles = await getRelatedArticles(article.slug, article.tags);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-16 pb-8 md:pt-24 md:pb-14">
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
        {siteConfig.blog.backToBlog}
      </Link>

      <article className="mt-8">
        <header className="mb-10 max-w-5xl">
          {article.tags.length > 0 ? (
            <div className="mb-5 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog/tag/${encodeURIComponent(tag)}`}
                  className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 hover:text-slate-950"
                >
                  {tag}
                </Link>
              ))}
            </div>
          ) : null}
          <h1 className="text-4xl font-black leading-tight text-slate-950 md:text-6xl">{article.title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
            {article.meta_description}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500">
            <time dateTime={article.created_at}>{formatDate(article.created_at)}</time>
            <span aria-hidden="true">/</span>
            <span>{article.reading_time_minutes} min read</span>
          </div>
        </header>

        {hasTableOfContents ? (
          <div className="lg:grid lg:grid-cols-[1fr_17rem] lg:gap-12">
            <div>
              {article.image_url ? (
                <div className="relative mb-12 aspect-[16/9] overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-2xl shadow-slate-200/70">
                  <Image
                    src={article.image_url}
                    alt={article.title}
                    fill
                    loading="eager"
                    sizes="(min-width: 1024px) 768px, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : null}

              <div className={styles.articleContent} dangerouslySetInnerHTML={{ __html: articleHtml }} />
            </div>

            <div className="hidden lg:block">
              <ArticleSidebar items={tocItems} />
            </div>
          </div>
        ) : (
          <>
            {article.image_url ? (
              <div className="relative mx-auto mb-12 max-w-3xl aspect-[16/9] overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-2xl shadow-slate-200/70">
                <Image
                  src={article.image_url}
                  alt={article.title}
                  fill
                  loading="eager"
                  sizes="(min-width: 768px) 768px, 100vw"
                  className="object-cover"
                />
              </div>
            ) : null}

            <div className={styles.articleContent} dangerouslySetInnerHTML={{ __html: articleHtml }} />
          </>
        )}
      </article>

      <RelatedArticles articles={relatedArticles} />
      <BackToTop />
    </main>
  );
};

export default ArticlePage;
