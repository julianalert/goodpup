import type { Metadata } from 'next';

import BlogListSkeleton from '../../_components/BlogListSkeleton';

export const metadata: Metadata = {
  title: 'Preview — Blog list loading',
  robots: { index: false, follow: false },
};

const BlogListLoadingPreview = () => <BlogListSkeleton />;

export default BlogListLoadingPreview;
