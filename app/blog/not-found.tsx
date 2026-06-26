import Link from 'next/link';
import type { Metadata } from 'next';

import { siteConfig } from '@/app/_config/siteConfig';

export const metadata: Metadata = {
  title: 'Article not found',
  description: 'The article you are looking for could not be found.',
  robots: { index: false, follow: true },
};

const BlogNotFound = () => {
  return (
    <main
      data-component="blog-not-found"
      className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-20 text-center md:py-28"
    >
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-default-accent">{siteConfig.blog.notFoundEyebrow}</p>
      <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
        {siteConfig.blog.notFoundTitle}
      </h1>
      <p className="mt-5 max-w-md text-base leading-7 text-slate-600">{siteConfig.blog.notFoundDek}</p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/blog"
          className="inline-flex items-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          {siteConfig.blog.backToBlog}
        </Link>
      </div>
    </main>
  );
};

export default BlogNotFound;
