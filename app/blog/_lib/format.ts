import { BLOG_DEFAULT_PAGE } from './constants';
import publishDateOverrides from './publishDateOverrides';

export const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
};

/** Returns the overridden date for a slug if one exists, otherwise the article's created_at. */
export const getPublishDate = (slug: string, createdAt: string): string => {
  return publishDateOverrides[slug] ?? createdAt;
};

/** Comparator: sorts articles newest-first using overridden publish dates. */
export const sortByPublishDateDesc = <T extends { slug: string; created_at: string }>(
  a: T,
  b: T,
): number => {
  const dateA = new Date(getPublishDate(a.slug, a.created_at)).getTime();
  const dateB = new Date(getPublishDate(b.slug, b.created_at)).getTime();
  return dateB - dateA;
};

export const getPageParam = (value: string | string[] | undefined) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = Number.parseInt(rawValue || '', 10);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : BLOG_DEFAULT_PAGE;
};
