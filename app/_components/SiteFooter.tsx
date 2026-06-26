import Link from 'next/link';

import { siteConfig } from '../_config/siteConfig';

const TwitterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const GitHubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

const EmailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="M2.5 4h15c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5h-15A1.5 1.5 0 011 14.5v-9C1 4.67 1.67 4 2.5 4zM18 6.4l-7.47 4.98a1 1 0 01-1.06 0L2 6.4V14h16V6.4zM3.13 5.5L10 10.08 16.87 5.5z" />
  </svg>
);

const buildEmailHref = (email: string): string => `mailto:${email}`;

type SocialLink = {
  key: string;
  href: string;
  label: string;
  icon: React.ReactNode;
};

const buildSocialLinks = (): SocialLink[] => {
  const links: SocialLink[] = [];
  const { twitter, linkedin, github, email } = siteConfig.socialLinks;

  if (twitter) links.push({ key: 'twitter', href: twitter, label: 'X (Twitter)', icon: <TwitterIcon /> });
  if (linkedin) links.push({ key: 'linkedin', href: linkedin, label: 'LinkedIn', icon: <LinkedInIcon /> });
  if (github) links.push({ key: 'github', href: github, label: 'GitHub', icon: <GitHubIcon /> });
  if (email) links.push({ key: 'email', href: buildEmailHref(email), label: 'Email', icon: <EmailIcon /> });

  return links;
};

const SiteFooter = () => {
  const currentYear = new Date().getFullYear();
  const socialLinks = buildSocialLinks();

  return (
    <footer data-component="site-footer" className="mt-20 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <Link href={siteConfig.homeUrl} className="inline-flex items-center gap-2.5">
              <span
                data-brand-mark
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white"
              >
                {siteConfig.brandName.charAt(0).toUpperCase()}
              </span>
              <span className="text-lg font-bold text-slate-950">{siteConfig.brandName}</span>
            </Link>
            {siteConfig.brandTagline ? (
              <p className="mt-3 max-w-xs text-sm leading-6 text-slate-600">{siteConfig.brandTagline}</p>
            ) : null}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Links</p>
            <ul className="mt-4 space-y-2.5">
              {siteConfig.navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-slate-700 underline-offset-4 transition hover:text-slate-950 hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {socialLinks.length ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Follow</p>
              <ul className="mt-4 flex gap-3">
                {socialLinks.map((link) => (
                  <li key={link.key}>
                    <a
                      href={link.href}
                      aria-label={link.label}
                      target={link.key === 'email' ? undefined : '_blank'}
                      rel={link.key === 'email' ? undefined : 'noopener noreferrer'}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
                    >
                      {link.icon}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
          © {currentYear} {siteConfig.footerCopyrightHolder}. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
