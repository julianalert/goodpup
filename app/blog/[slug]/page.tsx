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
import s from '../blog.module.css';

export const revalidate = 86400;

type Props = { params: Promise<{ slug: string }> };

export const generateStaticParams = async () => {
  const articles = await getStaticArticles();
  return articles.map((article) => ({ slug: article.slug }));
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const resolvedParams = await params;
  const article = await getArticle(resolvedParams.slug);
  if (!article) return { title: 'Article not found' };
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
  if (!article) notFound();

  const { html: articleHtml, tocItems } = ensureHeadingIds(article.html);
  const hasTableOfContents = tocItems.length > 0;
  const relatedArticles = await getRelatedArticles(article.slug, article.tags);

  return (
    <main className={s.articlePage}>
      <Link href="/blog" className={s.backLink}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
        {siteConfig.blog.backToBlog}
      </Link>

      <article>
        <header className={s.articleHeader}>
          {article.tags.length > 0 ? (
            <div className={s.articleTags}>
              {article.tags.map((tag) => (
                <Link key={tag} href={`/blog/tag/${encodeURIComponent(tag)}`} className={s.articleTag}>{tag}</Link>
              ))}
            </div>
          ) : null}
          <h1 className={s.articleTitle}>{article.title}</h1>
          <p className={s.articleDek}>{article.meta_description}</p>
          <div className={s.articleMeta}>
            <time dateTime={article.created_at}>{formatDate(article.created_at)}</time>
            <span className={s.articleMetaDot}>·</span>
            <span>{article.reading_time_minutes} min read</span>
          </div>
        </header>

        {hasTableOfContents ? (
          <div className={s.articleLayout}>
            <div>
              {article.image_url ? (
                <div className={s.articleImageWrap}>
                  <Image src={article.image_url} alt={article.title} fill loading="eager" sizes="(min-width: 900px) 720px, 100vw" className="object-cover" />
                </div>
              ) : null}
              <div className={styles.articleContent} dangerouslySetInnerHTML={{ __html: articleHtml }} />
            </div>
            <ArticleSidebar items={tocItems} />
          </div>
        ) : (
          <>
            {article.image_url ? (
              <div className={s.articleImageWrap} style={{ maxWidth: '720px', margin: '0 auto 40px' }}>
                <Image src={article.image_url} alt={article.title} fill loading="eager" sizes="(min-width: 768px) 720px, 100vw" className="object-cover" />
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
