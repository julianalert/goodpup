import { BLOG_DEFAULT_PAGE } from './constants';

export const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
};

export const getPageParam = (value: string | string[] | undefined) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = Number.parseInt(rawValue || '', 10);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : BLOG_DEFAULT_PAGE;
};
