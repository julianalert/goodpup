export type SiteNavLink = {
  label: string;
  href: string;
};

export type SiteSocialLinks = {
  twitter?: string;
  linkedin?: string;
  github?: string;
  email?: string;
};

export type SiteBlogConfig = {
  indexEyebrow: string;
  indexTitle: string;
  indexDek: string;
  indexMetaDescription: string;

  tagEyebrow: string;

  relatedEyebrow: string;
  relatedTitle: string;

  tableOfContentsLabel: string;

  emptyState: string;
  backToBlog: string;
  allArticles: string;

  errorEyebrow: string;
  errorTitle: string;
  errorDek: string;
  errorRetry: string;

  notFoundEyebrow: string;
  notFoundTitle: string;
  notFoundDek: string;
};

export type SiteConfig = {
  brandName: string;
  brandTagline?: string;
  logoUrl?: string;
  homeUrl: string;
  navLinks: SiteNavLink[];
  socialLinks: SiteSocialLinks;
  footerCopyrightHolder: string;
  blog: SiteBlogConfig;
};

export const siteConfig: SiteConfig = {
  brandName: 'Your Brand',
  brandTagline: 'AI-powered content for teams that need to ship.',
  logoUrl: undefined,
  homeUrl: '/',
  navLinks: [
    { label: 'Home', href: '/' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Blog', href: '/blog' },
    { label: 'About', href: '/about' },
  ],
  socialLinks: {
    twitter: 'https://twitter.com/yourbrand',
    linkedin: 'https://www.linkedin.com/company/yourbrand',
    github: undefined,
    email: 'hello@yourbrand.com',
  },
  footerCopyrightHolder: 'Your Brand',
  blog: {
    indexEyebrow: 'Blog',
    indexTitle: "This Is Your Brand's Blog",
    indexDek: 'Essays, dispatches, and notes from the team.',
    indexMetaDescription: 'Read the latest articles.',

    tagEyebrow: 'Tag',

    relatedEyebrow: 'Keep reading',
    relatedTitle: 'More articles',

    tableOfContentsLabel: 'Table of contents',

    emptyState: 'No articles found.',
    backToBlog: 'Back to blog',
    allArticles: 'All articles',

    errorEyebrow: 'Error',
    errorTitle: 'Something went sideways.',
    errorDek: 'We hit an unexpected error loading this page. Try again, or head back to the archive.',
    errorRetry: 'Try again',

    notFoundEyebrow: '404',
    notFoundTitle: "We couldn't find that article.",
    notFoundDek:
      "The piece you're looking for may have been moved or the link is mistyped. Browse the archive instead.",
  },
};
