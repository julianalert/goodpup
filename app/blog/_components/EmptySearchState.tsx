import Link from 'next/link';

import type { OutrankArticleSummary } from '../_types/blog';
import s from '../blog.module.css';

const SUGGESTED_TAGS_LIMIT = 5;
const QUERY_DISPLAY_MAX_LENGTH = 40;

type Props = { query: string; allArticles: OutrankArticleSummary[]; onReset?: () => void };

const truncateQuery = (value: string) =>
  value.length > QUERY_DISPLAY_MAX_LENGTH ? `${value.slice(0, QUERY_DISPLAY_MAX_LENGTH)}…` : value;

const titleCaseTag = (tag: string) =>
  tag.split('-').map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p)).join(' ');

const collectPopularTags = (articles: OutrankArticleSummary[]) => {
  const counts = new Map<string, number>();
  for (const article of articles) {
    for (const tag of article.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, SUGGESTED_TAGS_LIMIT).map(([tag]) => tag);
};

const EmptySearchState = ({ query, allArticles, onReset }: Props) => {
  const popularTags = collectPopularTags(allArticles);

  return (
    <div className={s.emptySearch}>
      <div className={s.emptySearchEmoji}>🐾</div>
      <h3 className={s.emptySearchTitle}>
        No results for <span className={s.emptySearchAccent}>"{truncateQuery(query)}"</span>
      </h3>
      <p className={s.emptySearchDek}>Try different keywords or browse popular topics below.</p>
      {onReset ? (
        <button type="button" onClick={onReset} className={s.emptySearchBtn}>Browse all articles</button>
      ) : (
        <Link href="/blog" className={s.emptySearchBtn}>Browse all articles</Link>
      )}
      {popularTags.length > 0 ? (
        <div className={s.emptySearchTags}>
          <p className={s.emptySearchTagsLabel}>Try searching for:</p>
          <div className={s.emptySearchTagList}>
            {popularTags.map((tag) => (
              <Link key={tag} href={`/blog/tag/${encodeURIComponent(tag)}`} className={s.emptySearchTag}>
                {titleCaseTag(tag)}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default EmptySearchState;
