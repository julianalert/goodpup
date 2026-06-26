'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { siteConfig } from '../_config/siteConfig';
import s from './site.module.css';

const SiteHeader = () => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header>
      <nav className={s.nav}>
        <Link href={siteConfig.homeUrl} className={s.navLogo} onClick={close}>
          <Image src="/icon.png" alt="" width={28} height={28} className={s.footerIcon} style={{ marginRight: 8, borderRadius: 6 }} />
          Paw<span>Craft</span>
        </Link>

        <div className={s.navLinks}>
          {siteConfig.navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={s.navLink}>
              {link.label}
            </Link>
          ))}
          <Link href="/" className={s.navCta}>
            Start Training 🐾
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={s.hamburger}
        >
          {open ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {open && (
        <div className={s.mobileMenu}>
          {siteConfig.navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={s.mobileLink} onClick={close}>
              {link.label}
            </Link>
          ))}
          <Link href="/" className={s.mobileCta} onClick={close}>
            Start Training 🐾
          </Link>
        </div>
      )}
    </header>
  );
};

export default SiteHeader;
