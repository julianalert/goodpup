'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { siteConfig } from '@/app/_config/siteConfig';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

const BlogError = ({ error, reset }: Props) => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[blog/error]', error);
    }
  }, [error]);

  return (
    <main
      data-component="blog-error"
      role="alert"
      className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-20 text-center md:py-28"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-red-600"
          aria-hidden="true"
        >
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
      </div>

      <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{siteConfig.blog.errorTitle}</h1>
      <p className="mt-4 max-w-md text-base leading-7 text-slate-600">{siteConfig.blog.errorDek}</p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          {siteConfig.blog.errorRetry}
        </button>
        <Link
          href="/blog"
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
        >
          {siteConfig.blog.backToBlog}
        </Link>
      </div>

      {error.digest ? (
        <p className="mt-8 text-xs font-mono text-slate-400">Reference: {error.digest}</p>
      ) : null}
    </main>
  );
};

export default BlogError;
