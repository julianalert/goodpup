import { BLOG_CARD_TAG_LIMIT } from '../_lib/constants';

const SKELETON_PARAGRAPH_COUNT = 8;
const SKELETON_TOC_ITEM_COUNT = 6;

const ArticleSkeleton = () => {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-16 pb-8 md:pt-24 md:pb-14">
      <div className="h-5 w-28 animate-pulse rounded bg-slate-200" />

      <article className="mt-8 animate-pulse">
        <header className="mb-10 max-w-5xl">
          <div className="mb-5 flex flex-wrap gap-2">
            {Array.from({ length: BLOG_CARD_TAG_LIMIT }).map((_, index) => (
              <div key={index} className="h-5 w-16 rounded-full bg-slate-200" />
            ))}
          </div>
          <div className="h-12 w-11/12 max-w-4xl rounded bg-slate-200 md:h-16" />
          <div className="mt-3 h-12 w-8/12 max-w-3xl rounded bg-slate-200 md:h-16" />
          <div className="mt-6 max-w-3xl space-y-2">
            <div className="h-5 rounded bg-slate-200" />
            <div className="h-5 w-10/12 rounded bg-slate-200" />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-4 w-20 rounded bg-slate-200" />
          </div>
        </header>

        <div className="lg:grid lg:grid-cols-[1fr_17rem] lg:gap-12">
          <div>
            <div className="relative mb-12 aspect-[16/9] rounded-lg bg-slate-200" />

            <div className="space-y-4">
              {Array.from({ length: SKELETON_PARAGRAPH_COUNT }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-4 rounded bg-slate-200" />
                  <div className="h-4 w-11/12 rounded bg-slate-200" />
                  <div className="h-4 w-9/12 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-3">
              <div className="h-3 w-20 rounded bg-slate-200" />
              {Array.from({ length: SKELETON_TOC_ITEM_COUNT }).map((_, index) => (
                <div key={index} className="h-4 w-11/12 rounded bg-slate-200" />
              ))}
            </div>
          </div>
        </div>
      </article>
    </main>
  );
};

export default ArticleSkeleton;
