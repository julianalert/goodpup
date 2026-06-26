import type { Metadata } from 'next';

import ArticleSkeleton from '../../_components/ArticleSkeleton';

export const metadata: Metadata = {
  title: 'Preview — Article loading',
  robots: { index: false, follow: false },
};

const ArticleLoadingPreview = () => <ArticleSkeleton />;

export default ArticleLoadingPreview;
