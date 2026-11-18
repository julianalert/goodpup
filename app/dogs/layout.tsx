import './dogs.css'
import Link from 'next/link'
import Image from 'next/image'
import { FaInstagram } from 'react-icons/fa'
import { HiOutlineMail } from 'react-icons/hi'
import SiteNav from '@/app/_components/SiteNav'
import { SITE_EMAIL } from '@/lib/site'

export default function DogsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav ctaHref="/start" ctaLabel="Get my dog's plan →" />
      <main>{children}</main>
      <footer className="dogs-footer">
        <div className="dogs-footer-inner">
          <div className="dogs-footer-brand">
            <Image src="/icon.png" alt="PawCraft" width={32} height={32} className="dogs-footer-icon" />
          </div>
          <p className="dogs-footer-tagline">30-day personalised dog training plans</p>
          <Link href="/dogs" className="dogs-footer-guide-link">Browse all breed guides →</Link>
          <div className="dogs-footer-social">
            <a href="https://www.instagram.com/trypawcraft/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href={`mailto:${SITE_EMAIL}`} aria-label="Contact">
              <HiOutlineMail />
            </a>
          </div>
          <p className="dogs-footer-legal">© 2026 PawCraft. Results may vary. Always consult a veterinary professional for medical or severe behavioural issues.</p>
        </div>
      </footer>
    </>
  )
}
