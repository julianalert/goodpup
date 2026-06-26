'use client';

import Link from 'next/link';
import { useState } from 'react';

import { siteConfig } from '../_config/siteConfig';

const BrandMark = () => {
  if (siteConfig.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={siteConfig.logoUrl} alt={siteConfig.brandName} className="h-7 w-auto" />
    );
  }

  return (
    <span
      data-brand-mark
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white"
    >
      {siteConfig.brandName.charAt(0).toUpperCase()}
    </span>
  );
};

const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
  </svg>
);

const SiteHeader = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen((isOpen) => !isOpen);

  return (
    <header
      data-component="site-header"
      className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
        <Link
          href={siteConfig.homeUrl}
          onClick={closeMobileMenu}
          className="flex items-center gap-2.5 text-lg font-bold text-slate-950 transition hover:opacity-80"
        >
          <BrandMark />
          <span>{siteConfig.brandName}</span>
        </Link>

        <nav className="hidden md:flex md:items-center md:gap-8" aria-label="Main">
          {siteConfig.navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-slate-700 underline-offset-4 transition hover:text-slate-950 hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
          onClick={toggleMobileMenu}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700 transition hover:bg-slate-50 md:hidden"
        >
          {isMobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
        </button>
      </div>

      {isMobileMenuOpen ? (
        <nav className="border-t border-slate-200 bg-white md:hidden" aria-label="Mobile">
          <ul className="flex flex-col px-4 py-2">
            {siteConfig.navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={closeMobileMenu}
                  className="block py-3 text-base font-semibold text-slate-700 underline-offset-4 transition hover:text-slate-950 hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
};

export default SiteHeader;
