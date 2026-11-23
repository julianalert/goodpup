// The paid extras a customer can add to their plan, at checkout or later from the
// training space. Safe to import from client and server code: data and small pure
// helpers only.
//
// Adding an add-on:
//   1. add its id to AddonId and an entry to ADDONS below
//   2. add its generator to GENERATORS in lib/addons-generate.ts
//   3. add its view to app/plan/[id]/space/AddonsSection.tsx (and a print layout
//      to app/plan/[id]/print/[addon]/page.tsx if it can be downloaded)
// Payment, storage, generation order, retries and the locked / being-written /
// ready states are shared by every add-on.

import { properName } from './plan-types'

export type AddonId = 'breed_handbook' | 'nutrition_plan'

/** What an add-on's wording is built from */
export interface AddonDog {
  /** "Max", or "your dog" when the quiz has no name */
  name: string
  /** "Border Collie"; empty when the owner gave no breed */
  breed: string
}

export interface AddonDef {
  id: AddonId
  priceCents: number
  /** Generic name for order lines and admin, e.g. "Breed handbook" */
  label: string
  /** The add-on's own title for this dog, e.g. "Max's Border Collie Handbook" */
  title: (dog: AddonDog) => string
  /** One sentence: what it is */
  pitch: (dog: AddonDog) => string
  /** What's inside, as shown on the locked card and the order page */
  contents: (dog: AddonDog) => string[]
  /** Short facts under the pitch, e.g. "About 30 pages" */
  facts: string[]
  /** Can this add-on be made for this dog at all? */
  available: (dog: AddonDog) => boolean
  /** What the customer reads while it is being generated */
  waitNote: string
  /**
   * Add-ons this one is written after, when the customer has them too, so it can
   * read them and agree with them. It never waits on one that has failed.
   */
  after?: AddonId[]
  /**
   * Set when the add-on needs answers from the customer before it can be
   * written. It is then not generated at payment: the customer gets an email
   * asking for the answers, gives them in the training space, and that starts
   * the writing (see app/api/addons/intake).
   */
  intake?: {
    /** One line wherever it is sold: what we ask, and why */
    note: (dog: AddonDog) => string
    emailSubject: (dog: AddonDog) => string
    /** The email's main paragraph, plain text */
    emailBody: (dog: AddonDog) => string
  }
}

const NO_NAME = 'your dog'
/** "Max's" / "Your dog's" at the start of a line */
const possessive = (name: string) => (name === NO_NAME ? "Your dog's" : `${name}'s`)
/** "Max's" / "your dog's" mid-sentence */
const possessiveMid = (name: string) => (name === NO_NAME ? "your dog's" : `${name}'s`)

export const ADDONS: Record<AddonId, AddonDef> = {
  breed_handbook: {
    id: 'breed_handbook',
    priceCents: 1200,
    label: 'Breed handbook',
    title: ({ name, breed }) => `${possessive(name)} ${breed} Handbook`,
    pitch: ({ name, breed }) =>
      `A complete owner's guide to the ${breed}, written around ${name}: age, home, routine and the answers you gave.`,
    contents: ({ name, breed }) => [
      `${name === NO_NAME ? 'Your dog' : name} at a glance: 12 traits and the breed fact sheet`,
      `What a ${breed} was built to do`,
      `Inside ${possessiveMid(name)} head: motivation, sensitivity, people and other animals`,
      `${possessive(name)} life stage and the next 12 months`,
      'Exercise and mental work',
      'Home life and a realistic daily schedule',
      'Feeding',
      'Health watch: early signs and what to ask the vet',
      'Grooming and body care',
      `Training a ${breed}: how the breed learns and what to expect next`,
      'Printable cheat sheets, including one for the dog-sitter',
    ],
    facts: ['About 40 pages', 'Read it in the Profile tab', 'Download and print as a PDF'],
    // A handbook about a breed needs a breed
    available: ({ breed }) => breed.trim().length >= 3,
    waitNote: 'Usually ready in 2 to 4 minutes.',
  },

  nutrition_plan: {
    id: 'nutrition_plan',
    priceCents: 1200,
    label: 'Nutrition plan',
    title: ({ name }) => `${possessive(name)} Nutrition Plan`,
    pitch: ({ name }) =>
      `How much, what and when to feed ${name}, worked out from ${possessiveMid(name)} own weight, body shape and food, with training treats counted in.`,
    contents: ({ name }) => [
      `${possessive(name)} feeding profile: daily calories, meals and treat allowance`,
      'How much to feed: the amount per meal of your own food',
      'What to feed: reading a label, and dry, wet and fresh compared',
      'The daily schedule, around walks and training',
      'Training treats without overfeeding',
      'Safe and unsafe foods',
      'Changing food and tummy troubles',
      'Weight and condition tracking',
      `Special cases for ${name}`,
      'Printable pages: feeding chart, weight log, shopping list and more',
    ],
    facts: ['About 25 pages', 'Portion calculator included', 'Download and print as a PDF'],
    // Every dog eats: no breed needed
    available: () => true,
    waitNote: 'Usually ready in 2 to 3 minutes.',
    // Its feeding advice must match the handbook's Feeding chapter
    after: ['breed_handbook'],
    // A feeding plan without the dog's weight is a guess: we ask first, then write
    intake: {
      note: ({ name }) =>
        `After you pay, you answer a dozen quick questions about ${name} (weight, body shape, current food). The plan is written from your answers.`,
      emailSubject: ({ name }) =>
        `${possessive(name)} nutrition plan: 2 minutes of questions first`,
      emailBody: ({ name }) =>
        `Thank you for adding the nutrition plan. To make the numbers ${possessiveMid(name)} own, and not an average dog's, we need a few things only you know: what ${name} weighs, the shape ${name} is in, and what is in the bowl today. It is a dozen quick questions and takes about two minutes. As soon as you answer, the plan is written, and we email you when it is ready.`,
    },
  },
}

/** Remembered per device once a ready add-on has been opened, so it stops being announced */
export const addonSeenKey = (sessionId: string, id: AddonId) => `pawcraft_addon_seen_${sessionId}_${id}`

export const ADDON_IDS = Object.keys(ADDONS) as AddonId[]

export const isAddonId = (value: unknown): value is AddonId =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(ADDONS, value)

/** Keeps the known ids, in registry order, without duplicates. */
export function cleanAddonIds(value: unknown): AddonId[] {
  const given = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []
  const wanted = new Set(given.map((v) => (typeof v === 'string' ? v.trim() : v)).filter(isAddonId))
  return ADDON_IDS.filter((id) => wanted.has(id))
}

/** 1200 → "$12", 1250 → "$12.50" */
export const formatPrice = (cents: number) => `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`

/** The dog as the add-ons' wording needs it, from quiz answers in either casing. */
export function addonDog(dogName: string | null | undefined, dogBreed: string | null | undefined): AddonDog {
  return { name: properName(dogName, NO_NAME), breed: properName(dogBreed, '') }
}

// ── State, as the training space holds it ──────────────────────────────────

/**
 * locked     not bought
 * awaiting_input  paid, waiting for the customer's answers (add-ons with an intake)
 * pending    paid, waiting for its turn (the plan is always generated first)
 * generating being written right now
 * ready      content is there
 * failed     the last attempt failed; retried automatically
 */
export type AddonStatus = 'locked' | 'awaiting_input' | 'pending' | 'generating' | 'ready' | 'failed'

export interface AddonState {
  id: AddonId
  status: AddonStatus
  /** The generated add-on; only sent when ready */
  content: unknown | null
  /** What the customer has entered inside the add-on (e.g. the portion calculator); only sent when ready */
  settings?: unknown | null
}
