import { type Article, type ArticlesResponse } from 'outrank-next-js-blog';

const MOCK_ARTICLE_HTML = `
  <p>This is a <strong>demo article</strong> rendered from local mock data because <code>OUTRANK_BLOG_API_KEY</code>
  is not set. Replace the placeholder in <code>.env.local</code> with a real Outrank Next.js Blog integration key
  to load real articles.</p>
  <h2>What this looks like in production</h2>
  <p>In production, articles are fetched from the Outrank API and rendered as server components with daily
  revalidation. Tags, pagination, and the sitemap all derive from the same data source.</p>
  <ul>
    <li>Server-side rendering with cached responses</li>
    <li>Tag-filtered article lists at <code>/blog/tag/[slug]</code></li>
    <li>Individual article pages at <code>/blog/[slug]</code></li>
  </ul>
  <blockquote>The blog design lives entirely in <code>app/blog</code>, so you can iterate on layout, typography,
  and styling without touching the data layer.</blockquote>
  <h3>Sample heading</h3>
  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore
  magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
  consequat.</p>
`;

const MOCK_IMAGE_URLS = [
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&q=80',
  'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=1200&q=80',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&q=80',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=80',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&q=80',
];

const MOCK_TAG_POOL = [
  ['seo', 'content-marketing'],
  ['ai', 'automation', 'productivity'],
  ['backlinks', 'seo'],
  ['keyword-research', 'seo', 'analytics'],
  ['next-js', 'engineering'],
  ['growth', 'marketing'],
  ['content-marketing', 'strategy'],
  ['ai', 'writing'],
  ['analytics', 'reporting'],
  ['seo', 'technical'],
];

const MOCK_TITLES = [
  'How to outrank your competitors with AI-generated content',
  'A practical guide to building a backlink exchange network',
  'Keyword research in 2026: tools, tactics, and traps',
  'Why on-brand imagery makes a real difference in SEO',
  'Scheduling content: turning a blog into a system',
  'The complete Next.js App Router blog blueprint',
  'Measuring what matters: SEO analytics beyond rankings',
  'AI writing workflows that actually save you time',
  'From idea to indexed in 24 hours',
  'Technical SEO checklist for fast-growing sites',
  'How tag pages quietly drive long-tail traffic',
  'Designing a blog reading experience people remember',
];

const DAY_MS = 86_400_000;

const buildMockArticle = (index: number): Article => {
  const id = `mock-${index + 1}`;
  const title = MOCK_TITLES[index % MOCK_TITLES.length];
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  const createdAt = new Date(Date.now() - (index + 1) * DAY_MS).toISOString();

  return {
    id,
    title,
    slug: `${slug}-${index + 1}`,
    meta_description:
      'A short demo description used while developing the blog design. ' +
      'Replace OUTRANK_BLOG_API_KEY in .env.local to load real articles.',
    html: MOCK_ARTICLE_HTML,
    content_markdown: '# Demo article\n\nThis is mock content shown while developing the blog design.',
    image_url: MOCK_IMAGE_URLS[index % MOCK_IMAGE_URLS.length],
    tags: MOCK_TAG_POOL[index % MOCK_TAG_POOL.length],
    created_at: createdAt,
    updated_at: createdAt,
    reading_time_minutes: 3 + (index % 8),
  };
};

const MOCK_ARTICLE_COUNT = 24;

const MOCK_ARTICLES: Article[] = Array.from({ length: MOCK_ARTICLE_COUNT }, (_, index) => buildMockArticle(index));

export const getMockArticlesResponse = (page: number, limit: number, tag: string): ArticlesResponse => {
  const filtered = tag ? MOCK_ARTICLES.filter((article) => article.tags.includes(tag)) : MOCK_ARTICLES;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const articles = filtered.slice(start, start + limit);

  return {
    articles,
    total,
    page,
    limit,
    total_pages: totalPages,
  };
};

export const getMockArticle = (slug: string): Article | null =>
  MOCK_ARTICLES.find((article) => article.slug === slug) || null;

export const getAllMockArticles = (): Article[] => MOCK_ARTICLES;
