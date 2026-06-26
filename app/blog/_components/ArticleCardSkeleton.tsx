import { BLOG_CARD_TAG_LIMIT } from '../_lib/constants';

const ArticleCardSkeleton = () => {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className="flex h-full animate-pulse flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      <div className="aspect-[16/9] bg-slate-200" />
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {Array.from({ length: BLOG_CARD_TAG_LIMIT }).map((_, index) => (
            <div key={index} className="h-5 w-16 rounded-full bg-slate-200" />
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-5 w-11/12 rounded bg-slate-200" />
          <div className="h-5 w-9/12 rounded bg-slate-200" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-slate-200" />
          <div className="h-3 w-11/12 rounded bg-slate-200" />
          <div className="h-3 w-8/12 rounded bg-slate-200" />
        </div>
        <div className="mt-auto flex items-center justify-between pt-6">
          <div className="h-3 w-20 rounded bg-slate-200" />
          <div className="h-3 w-16 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
};

export default ArticleCardSkeleton;
