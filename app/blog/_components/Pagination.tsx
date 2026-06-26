import Link from 'next/link';

import { BLOG_DEFAULT_PAGE, BLOG_PAGINATION_MIN_PAGES_FOR_ARROWS, BLOG_PAGINATION_SIBLING_COUNT, BLOG_PAGINATION_VISIBLE_PAGE_GAP } from '../_lib/constants';
import s from '../blog.module.css';

type Props = { basePath: string; currentPage: number; totalPages: number };
type PaginationItem = { type: 'page'; page: number } | { type: 'ellipsis'; key: string };

const getPageHref = (basePath: string, page: number) =>
  page === BLOG_DEFAULT_PAGE ? basePath : `${basePath}?page=${page}`;

const getPaginationItems = (currentPage: number, totalPages: number): PaginationItem[] => {
  const pages = new Set<number>([BLOG_DEFAULT_PAGE, totalPages]);
  for (let page = currentPage - BLOG_PAGINATION_SIBLING_COUNT; page <= currentPage + BLOG_PAGINATION_SIBLING_COUNT; page++) {
    if (page > BLOG_DEFAULT_PAGE && page < totalPages) pages.add(page);
  }
  return Array.from(pages).sort((a, b) => a - b).reduce<PaginationItem[]>((items, page, index, sorted) => {
    const prev = sorted[index - 1];
    if (prev && page - prev > BLOG_PAGINATION_VISIBLE_PAGE_GAP) {
      items.push({ type: 'ellipsis', key: prev === BLOG_DEFAULT_PAGE ? 'start-ellipsis' : 'end-ellipsis' });
    }
    items.push({ type: 'page', page });
    return items;
  }, []);
};

const ChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const Pagination = ({ basePath, currentPage, totalPages }: Props) => {
  if (totalPages <= 1) return null;
  const items = getPaginationItems(currentPage, totalPages);
  const showArrows = totalPages >= BLOG_PAGINATION_MIN_PAGES_FOR_ARROWS;

  return (
    <nav className={s.pagination} aria-label="Pagination">
      {showArrows && currentPage > 1 ? (
        <Link href={getPageHref(basePath, currentPage - 1)} aria-label="Previous page" className={s.pageBtn}><ChevronLeft /></Link>
      ) : null}
      {items.map((item) =>
        item.type === 'ellipsis' ? (
          <span key={item.key} className={s.pageEllipsis} aria-hidden="true">…</span>
        ) : (
          <Link
            key={item.page}
            href={getPageHref(basePath, item.page)}
            aria-current={item.page === currentPage ? 'page' : undefined}
            className={`${s.pageBtn} ${item.page === currentPage ? s.pageBtnActive : ''}`}
          >
            {item.page}
          </Link>
        )
      )}
      {showArrows && currentPage < totalPages ? (
        <Link href={getPageHref(basePath, currentPage + 1)} aria-label="Next page" className={s.pageBtn}><ChevronRight /></Link>
      ) : null}
    </nav>
  );
};

export default Pagination;
