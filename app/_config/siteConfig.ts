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
  brandName: 'PawCraft',
  brandTagline: 'Expert dog training guides, tips, and resources for every pup.',
  logoUrl: undefined,
  homeUrl: '/',
  navLinks: [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
  ],
  socialLinks: {
    twitter: undefined,
    linkedin: undefined,
    github: undefined,
    email: 'hello@mypawcraft.com',
  },
  footerCopyrightHolder: 'PawCraft',
  blog: {
    indexEyebrow: 'Dog Training Blog',
    indexTitle: 'Tips & Guides for Every Pup',
    indexDek: 'Expert advice on training, behaviour, and raising a happy, well-behaved dog.',
    indexMetaDescription: 'Expert dog training tips, guides and resources from the PawCraft team.',

    tagEyebrow: 'Topic',

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
