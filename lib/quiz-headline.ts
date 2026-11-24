// The quiz page's headline, matched to what the visitor was looking for when they
// clicked an ad. The Puppy Training and Behavior Problems ad groups each get their
// own wording; everyone else (the Training Plan ad group included) sees the default.
// Variants stay the same length as the default: only a word or two changes.

import type { Attribution } from './attribution'

export type QuizHeadlineKey = 'default' | 'puppy' | 'behavior'

export interface QuizHeadline {
  /** First line of the h1 */
  lead: string
  /** Emphasised end of the second line, after "We'll build " */
  emphasis: string
  /** Paragraph under the h1 */
  sub: string
}

export const QUIZ_HEADLINES: Record<QuizHeadlineKey, QuizHeadline> = {
  default: {
    lead: 'Tell us about your dog.',
    emphasis: 'their 30-day personalised training plan.',
    sub: 'Answer 5 quick questions so we can create a program that actually fits your dog, not a generic guide.',
  },
  puppy: {
    lead: 'Tell us about your puppy.',
    emphasis: 'their 30-day puppy training plan.',
    sub: 'Answer 5 quick questions so we can create a program that actually fits your puppy, not a generic guide.',
  },
  behavior: {
    lead: 'Tell us about your dog.',
    emphasis: 'their 30-day behavior training plan.',
    sub: 'Answer 5 quick questions so we can create a program that actually fits your dog, not a generic guide.',
  },
}

// Words looked for in a UTM value, most specific first
const MATCHERS: { key: QuizHeadlineKey; pattern: RegExp }[] = [
  { key: 'puppy',    pattern: /pupp/ },
  { key: 'behavior', pattern: /behavio|problem/ },
]

type CampaignTags = Pick<Attribution, 'utm_campaign' | 'utm_content' | 'utm_term'>

/**
 * Which headline fits this visitor. The ad group (utm_content) is checked first,
 * then the search keyword (utm_term), then the campaign name.
 */
export function quizHeadlineKey(tags: CampaignTags | null | undefined): QuizHeadlineKey {
  if (!tags) return 'default'
  for (const value of [tags.utm_content, tags.utm_term, tags.utm_campaign]) {
    if (!value) continue
    const text = value.toLowerCase()
    const match = MATCHERS.find((m) => m.pattern.test(text))
    if (match) return match.key
  }
  return 'default'
}
