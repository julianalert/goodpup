'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { siteConfig } from '@/app/_config/siteConfig';
import { BLOG_INDEX_EAGER_IMAGE_LIMIT, BLOG_SEARCH_DEBOUNCE_MS } from '../_lib/constants';
import ArticleCard from './ArticleCard';
import EmptySearchState from './EmptySearchState';
import Pagination from './Pagination';
import type { OutrankArticleSummary } from '../_types/blog';
import s from '../blog.module.css';

const SEARCH_PARAM = 'q';
const PAGE_PARAM = 'page';

type Props = {
  paginatedArticles: OutrankArticleSummary[];
  allArticles: OutrankArticleSummary[];
  currentPage: number;
  totalPages: number;
};

const BlogList = ({ paginatedArticles, allArticles, currentPage, totalPages }: Props) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialQuery = searchParams.get(SEARCH_PARAM) || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(searchQuery), BLOG_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const trimmedQuery = debouncedQuery.trim();
    if (trimmedQuery) { params.set(SEARCH_PARAM, trimmedQuery); } else { params.delete(SEARCH_PARAM); }
    if (trimmedQuery) params.delete(PAGE_PARAM);
    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (nextUrl !== currentUrl) router.replace(nextUrl, { scroll: false });
  }, [debouncedQuery, pathname, router]);

  const trimmedQuery = debouncedQuery.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  const filteredResults = useMemo(() => {
    if (!isSearching) return [];
    return allArticles.filter((a) =>
      a.title.toLowerCase().includes(normalizedQuery) ||
      a.meta_description.toLowerCase().includes(normalizedQuery)
    );
  }, [isSearching, normalizedQuery, allArticles]);

  const displayedArticles = isSearching ? filteredResults : paginatedArticles;
  const showPagination = !isSearching && totalPages > 1;

  return (
    <>
      <div className={s.searchWrap}>
        <span className={s.searchIcon}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search articles…"
          aria-label="Search articles"
          className={s.searchInput}
        />
        {searchQuery ? (
          <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search" className={s.searchClear}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      {displayedArticles.length ? (
        <div className={s.grid}>
          {displayedArticles.map((article, index) => (
            <ArticleCard
              key={article.id}
              article={article}
              imageLoading={index < BLOG_INDEX_EAGER_IMAGE_LIMIT ? 'eager' : 'lazy'}
            />
          ))}
        </div>
      ) : isSearching ? (
        <EmptySearchState query={trimmedQuery} allArticles={allArticles} onReset={() => setSearchQuery('')} />
      ) : (
        <div className={s.emptyGrid}>{siteConfig.blog.emptyState}</div>
      )}

      {showPagination ? <Pagination basePath="/blog" currentPage={currentPage} totalPages={totalPages} /> : null}
    </>
  );
};

export default BlogList;
