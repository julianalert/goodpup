'use client'

interface Props {
  html: string
}

// Client component so Next.js RSC script injection doesn't land inside
// the dangerouslySetInnerHTML div and cause a hydration mismatch.
export function PlanContent({ html }: Props) {
  return <div dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
}
