import './dogs.css'
import Link from 'next/link'
import Image from 'next/image'
import { FaInstagram, FaTiktok } from 'react-icons/fa'
import { HiOutlineMail } from 'react-icons/hi'

export default function DogsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="dogs-nav">
        <Link href="/" className="dogs-nav-logo">
          <Image src="/icon.png" alt="" width={28} height={28} className="appIcon" />
          Paw<span>Craft</span>
        </Link>
        <Link href="/form" className="dogs-nav-cta">Get my dog&apos;s plan →</Link>
      </nav>
      <main>{children}</main>
      <footer className="dogs-footer">
        <div className="dogs-footer-inner">
          <div className="dogs-footer-brand">
            <Image src="/icon.png" alt="PawCraft" width={32} height={32} className="dogs-footer-icon" />
          </div>
          <p className="dogs-footer-tagline">30-day personalised dog training plans</p>
          <div className="dogs-footer-social">
            <a href="https://www.instagram.com/trypawcraft/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="https://www.tiktok.com/@seraphova" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <FaTiktok />
            </a>
            <a href="mailto:hello@mypawcraft.com" aria-label="Contact">
              <HiOutlineMail />
            </a>
          </div>
          <p className="dogs-footer-legal">© 2026 PawCraft. Results may vary. Always consult a veterinary professional for medical or severe behavioural issues.</p>
        </div>
      </footer>
    </>
  )
}
