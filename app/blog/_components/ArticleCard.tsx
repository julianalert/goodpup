import Image from 'next/image';
import Link from 'next/link';

import type { OutrankArticleSummary } from '../_types/blog';
import { BLOG_CARD_TAG_LIMIT } from '../_lib/constants';
import { formatDate, getPublishDate } from '../_lib/format';
import s from '../blog.module.css';

type Props = {
  article: OutrankArticleSummary;
  imageLoading?: 'eager' | 'lazy';
};

const ArticleCard = ({ article, imageLoading = 'lazy' }: Props) => {
  const visibleTags = article.tags.slice(0, BLOG_CARD_TAG_LIMIT);

  return (
    <article className={s.card}>
      {article.image_url ? (
        <Link href={`/blog/${article.slug}`} className={s.cardImageWrap}>
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            loading={imageLoading}
            sizes="(min-width: 900px) 33vw, (min-width: 600px) 50vw, 100vw"
            className={s.cardImage}
          />
        </Link>
      ) : null}
      <div className={s.cardBody}>
        {visibleTags.length > 0 ? (
          <div className={s.cardTags}>
            {visibleTags.map((tag) => (
              <Link key={tag} href={`/blog/tag/${encodeURIComponent(tag)}`} className={s.cardTag}>
                {tag}
              </Link>
            ))}
          </div>
        ) : null}
        <Link href={`/blog/${article.slug}`} className={s.cardTitle}>
          {article.title}
        </Link>
        <p className={s.cardDesc}>{article.meta_description}</p>
        <div className={s.cardMeta}>
          <time dateTime={getPublishDate(article.slug, article.created_at)}>{formatDate(getPublishDate(article.slug, article.created_at))}</time>
          <span>{article.reading_time_minutes} min read</span>
        </div>
      </div>
    </article>
  );
};

export default ArticleCard;
