import './dogs.css'
import Link from 'next/link'
import Image from 'next/image'

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
        <strong>PawCraft</strong> · 30-day personalised dog training plans<br />
        <a href="#">Privacy Policy</a> · <a href="#">Terms</a> · <a href="#">Contact</a><br /><br />
        © 2026 PawCraft. Results may vary. Always consult a veterinary professional for medical or severe behavioural issues.
      </footer>
    </>
  )
}
