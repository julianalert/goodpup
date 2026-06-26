'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { siteConfig } from '@/app/_config/siteConfig';

import { BLOG_INDEX_EAGER_IMAGE_LIMIT, BLOG_SEARCH_DEBOUNCE_MS } from '../_lib/constants';
import ArticleCard from './ArticleCard';
import EmptySearchState from './EmptySearchState';
import Pagination from './Pagination';
import type { OutrankArticleSummary } from '../_types/blog';

const SEARCH_PARAM = 'q';
const PAGE_PARAM = 'page';

type Props = {
  paginatedArticles: OutrankArticleSummary[];
  allArticles: OutrankArticleSummary[];
  currentPage: number;
  totalPages: number;
};

const SearchIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const ClearIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

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
    if (trimmedQuery) {
      params.set(SEARCH_PARAM, trimmedQuery);
    } else {
      params.delete(SEARCH_PARAM);
    }

    if (trimmedQuery) {
      params.delete(PAGE_PARAM);
    }

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [debouncedQuery, pathname, router]);

  const trimmedQuery = debouncedQuery.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  const filteredResults = useMemo(() => {
    if (!isSearching) return [];
    return allArticles.filter((article) => {
      return (
        article.title.toLowerCase().includes(normalizedQuery) ||
        article.meta_description.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [isSearching, normalizedQuery, allArticles]);

  const displayedArticles = isSearching ? filteredResults : paginatedArticles;
  const showPagination = !isSearching && totalPages > 1;

  return (
    <>
      <div className="mx-auto mb-12 max-w-2xl">
        <div className="relative">
          <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search articles…"
            aria-label="Search articles"
            className="h-14 w-full rounded-full border border-slate-200 bg-white pl-14 pr-14 text-base text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-[rgb(var(--default-accent)/0.4)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--default-accent)/0.15)] [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <ClearIcon />
            </button>
          ) : null}
        </div>
      </div>

      {displayedArticles.length ? (
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
          {displayedArticles.map((article, index) => (
            <ArticleCard
              key={article.id}
              article={article}
              imageLoading={index < BLOG_INDEX_EAGER_IMAGE_LIMIT ? 'eager' : 'lazy'}
            />
          ))}
        </div>
      ) : isSearching ? (
        <EmptySearchState
          query={trimmedQuery}
          allArticles={allArticles}
          onReset={() => setSearchQuery('')}
        />
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          {siteConfig.blog.emptyState}
        </div>
      )}

      {showPagination ? <Pagination basePath="/blog" currentPage={currentPage} totalPages={totalPages} /> : null}
    </>
  );
};

export default BlogList;
