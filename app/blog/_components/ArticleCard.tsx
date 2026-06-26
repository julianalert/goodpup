import Image from 'next/image';
import Link from 'next/link';

import type { OutrankArticleSummary } from '../_types/blog';
import { BLOG_CARD_TAG_LIMIT } from '../_lib/constants';
import { formatDate } from '../_lib/format';

type Props = {
  article: OutrankArticleSummary;
  imageLoading?: 'eager' | 'lazy';
};

const ArticleCard = ({ article, imageLoading = 'lazy' }: Props) => {
  const visibleTags = article.tags.slice(0, BLOG_CARD_TAG_LIMIT);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)] transition duration-200 hover:border-slate-200 hover:shadow-[0_2px_6px_rgba(15,23,42,0.06),0_16px_36px_rgba(15,23,42,0.08)]">
      {article.image_url ? (
        <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            loading={imageLoading}
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col p-6">
        {visibleTags.length > 0 ? (
          <div className="relative z-10 mb-4 flex flex-wrap gap-2">
            {visibleTags.map((tag) => (
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
        <h2 className="text-xl font-semibold leading-tight text-slate-950 transition group-hover:text-default-accent">
          <Link
            href={`/blog/${article.slug}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {article.title}
          </Link>
        </h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{article.meta_description}</p>
        <div className="mt-auto flex items-center justify-between gap-4 pt-6 text-xs font-medium text-slate-600">
          <time dateTime={article.created_at}>{formatDate(article.created_at)}</time>
          <span>{article.reading_time_minutes} min read</span>
        </div>
      </div>
    </article>
  );
};

export default ArticleCard;
