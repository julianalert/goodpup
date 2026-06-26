import Image from 'next/image';
import Link from 'next/link';
import { FaInstagram, FaTiktok } from 'react-icons/fa';
import { HiOutlineMail } from 'react-icons/hi';

import s from './site.module.css';

const SiteFooter = () => (
  <footer className={s.footer}>
    <div className={s.footerInner}>
      <Link href="/" className={s.footerBrand}>
        <Image src="/icon.png" alt="PawCraft" width={32} height={32} className={s.footerIcon} />
        <span className={s.footerBrandName}>Paw<span>Craft</span></span>
      </Link>
      <p className={s.footerTagline}>Expert dog training guides, tips, and resources for every pup.</p>
      <div className={s.footerSocial}>
        <a href="https://www.instagram.com/trypawcraft/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <FaInstagram />
        </a>
        <a href="https://www.tiktok.com/@seraphova" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
          <FaTiktok />
        </a>
        <a href="mailto:hello@mypawcraft.com" aria-label="Email">
          <HiOutlineMail />
        </a>
      </div>
      <p className={s.footerLegal}>© {new Date().getFullYear()} PawCraft. All rights reserved.</p>
    </div>
  </footer>
);

export default SiteFooter;
