import { siteConfig } from '@/app/_config/siteConfig';

import ArticleCard from './ArticleCard';
import type { OutrankArticleSummary } from '../_types/blog';

type Props = {
  articles: OutrankArticleSummary[];
};

const RelatedArticles = ({ articles }: Props) => {
  if (articles.length === 0) return null;

  return (
    <section className="mt-20 border-t border-slate-200 pt-12 md:mt-28 md:pt-16" aria-labelledby="related-articles-heading">
      <header className="mb-8 max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-default-accent">{siteConfig.blog.relatedEyebrow}</p>
        <h2 id="related-articles-heading" className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
          {siteConfig.blog.relatedTitle}
        </h2>
      </header>

      <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
};

export default RelatedArticles;
