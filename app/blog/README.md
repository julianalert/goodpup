# Outrank Default Blog Template

This is the default Outrank blog implementation. For the default starter setup, copy all three app folders into a
Next.js App Router project after installing the `outrank-next-js-blog@^0.1.2` package:

Deployed demo: `https://outrank.so/blog-templates/default`

```text
app/blog -> app/blog
app/_config -> app/_config
app/_components -> app/_components
```

Do not copy only `app/blog` unless your target app already provides a compatible `app/_config/siteConfig.ts` and its
own layout/header/footer.

Required server-side environment variable:

```env
OUTRANK_BLOG_API_KEY=your_outrank_blog_api_key
```

This folder includes:

- `/blog`
- `/blog/[slug]`
- `/blog/tag/[slug]`
- `/blog/sitemap.xml`
- local components, styles, types, constants, formatting helpers, and the Outrank API wrapper

The UI is intentionally neutral so it can be customized quickly. If you want a stronger visual direction, use one of
the complete replacement templates in this repo's `templates/` directory.

Styling uses Tailwind utility classes, so the target app must have Tailwind configured to scan `app/**/*.{ts,tsx}`.

## Cache Behavior

This folder uses Next.js caching for article lists, article pages, tag pages, and sitemap data.

- In production, blog content revalidates once per day.
- In development, blog content revalidates almost immediately.
- Outrank clears its API cache when articles are published, but your deployed Next.js site can still take up to one day
  to show changes because it has its own cache.
- Redeploy the site or add on-demand revalidation if you need updates sooner.
