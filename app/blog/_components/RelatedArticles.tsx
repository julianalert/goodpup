import { siteConfig } from '@/app/_config/siteConfig';
import ArticleCard from './ArticleCard';
import type { OutrankArticleSummary } from '../_types/blog';
import s from '../blog.module.css';

type Props = { articles: OutrankArticleSummary[] };

const RelatedArticles = ({ articles }: Props) => {
  if (articles.length === 0) return null;

  return (
    <section className={s.related} aria-labelledby="related-articles-heading">
      <p className={s.relatedEyebrow}>{siteConfig.blog.relatedEyebrow}</p>
      <h2 id="related-articles-heading" className={s.relatedTitle}>{siteConfig.blog.relatedTitle}</h2>
      <div className={s.grid}>
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
};

export default RelatedArticles;
