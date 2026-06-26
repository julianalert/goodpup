import Link from 'next/link';

import {
  BLOG_DEFAULT_PAGE,
  BLOG_PAGINATION_MIN_PAGES_FOR_ARROWS,
  BLOG_PAGINATION_SIBLING_COUNT,
  BLOG_PAGINATION_VISIBLE_PAGE_GAP,
} from '../_lib/constants';

type Props = {
  basePath: string;
  currentPage: number;
  totalPages: number;
};

type PaginationItem =
  | {
      type: 'page';
      page: number;
    }
  | {
      type: 'ellipsis';
      key: string;
    };

const PAGINATION_ITEM_PAGE = 'page';
const PAGINATION_ITEM_ELLIPSIS = 'ellipsis';
const PAGINATION_START_ELLIPSIS_KEY = 'start-ellipsis';
const PAGINATION_END_ELLIPSIS_KEY = 'end-ellipsis';

const getPageHref = (basePath: string, page: number) => {
  return page === BLOG_DEFAULT_PAGE ? basePath : `${basePath}?page=${page}`;
};

const getPaginationItems = (currentPage: number, totalPages: number): PaginationItem[] => {
  const pages = new Set<number>([BLOG_DEFAULT_PAGE, totalPages]);

  for (
    let page = currentPage - BLOG_PAGINATION_SIBLING_COUNT;
    page <= currentPage + BLOG_PAGINATION_SIBLING_COUNT;
    page++
  ) {
    if (page > BLOG_DEFAULT_PAGE && page < totalPages) {
      pages.add(page);
    }
  }

  return Array.from(pages)
    .sort((firstPage, secondPage) => firstPage - secondPage)
    .reduce<PaginationItem[]>((items, page, index, sortedPages) => {
      const previousPage = sortedPages[index - 1];

      if (previousPage && page - previousPage > BLOG_PAGINATION_VISIBLE_PAGE_GAP) {
        items.push({
          type: PAGINATION_ITEM_ELLIPSIS,
          key: previousPage === BLOG_DEFAULT_PAGE ? PAGINATION_START_ELLIPSIS_KEY : PAGINATION_END_ELLIPSIS_KEY,
        });
      }

      items.push({ type: PAGINATION_ITEM_PAGE, page });

      return items;
    }, []);
};

const Pagination = ({ basePath, currentPage, totalPages }: Props) => {
  if (totalPages <= 1) return null;

  const paginationItems = getPaginationItems(currentPage, totalPages);
  const showArrows = totalPages >= BLOG_PAGINATION_MIN_PAGES_FOR_ARROWS;

  return (
    <nav className="mt-14 flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
      {showArrows && currentPage > 1 ? (
        <Link
          href={getPageHref(basePath, currentPage - 1)}
          aria-label="Previous page"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
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
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
      ) : null}
      {paginationItems.map((item) =>
        item.type === PAGINATION_ITEM_ELLIPSIS ? (
          <span key={item.key} className="px-2 text-sm text-slate-500" aria-hidden="true">
            ...
          </span>
        ) : (
          <Link
            key={item.page}
            href={getPageHref(basePath, item.page)}
            aria-current={item.page === currentPage ? 'page' : undefined}
            className={`inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-md border px-3 text-sm font-semibold leading-none shadow-sm transition ${
              item.page === currentPage
                ? 'border-slate-950 bg-slate-950 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {item.page}
          </Link>
        ),
      )}
      {showArrows && currentPage < totalPages ? (
        <Link
          href={getPageHref(basePath, currentPage + 1)}
          aria-label="Next page"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
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
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      ) : null}
    </nav>
  );
};

export default Pagination;
