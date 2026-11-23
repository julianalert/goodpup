// The breed handbook add-on, as stored in submission_addons.content.
// Safe to import from client and server code: types and small pure helpers only.
//
// The book is structured data, not HTML, so the same content renders in the
// training space (chapters you open one at a time) and in the print layout.

/**
 * text   a paragraph (text)
 * list   bullet points (items), with an optional title
 * steps  numbered steps (items), with an optional title
 * facts  label / value rows; each item is written "Label: value"
 * tip    a highlighted practical tip (title + text)
 * watch  something to keep an eye on (title + text)
 * vet    when to involve the vet (title + text)
 */
export type HandbookBlockKind = 'text' | 'list' | 'steps' | 'facts' | 'tip' | 'watch' | 'vet'

export const HANDBOOK_BLOCK_KINDS: HandbookBlockKind[] = ['text', 'list', 'steps', 'facts', 'tip', 'watch', 'vet']

export interface HandbookBlock {
  kind: HandbookBlockKind
  /** Empty when the block has no title */
  title: string
  /** Empty for list, steps and facts blocks */
  text: string
  /** Empty for text blocks */
  items: string[]
}

export interface HandbookSection {
  heading: string
  blocks: HandbookBlock[]
}

export interface HandbookChapter {
  id: HandbookChapterId
  /** 2–10; chapter 1 is the "at a glance" page built from the fields below */
  number: number
  title: string
  intro: string
  sections: HandbookSection[]
}

export interface HandbookTrait {
  label: string
  /** 0–100, drives the bar */
  percent: number
  /** One sentence about this dog */
  note: string
}

export interface HandbookSheet {
  id: HandbookSheetId
  title: string
  /** One line under the title: how to use the page */
  note: string
  groups: { label: string; items: string[] }[]
}

export interface Handbook {
  version: 1
  /** "Max's Border Collie Handbook" */
  title: string
  dogName: string
  breed: string
  /** One sentence under the title */
  subtitle: string
  // Chapter 1, "at a glance"
  glanceIntro: string
  facts: { label: string; value: string }[]
  traits: HandbookTrait[]
  keyPoints: string[]
  // Chapters 2–10
  chapters: HandbookChapter[]
  /** Printable one-pagers */
  sheets: HandbookSheet[]
  generatedAt: string
}

// ── The fixed shape of the book ────────────────────────────────────────────
// Titles are decided here, not by the model, so the locked preview, the reader
// and the print layout always agree.

export type HandbookChapterId =
  | 'origin' | 'mind' | 'life_stage' | 'exercise' | 'home' | 'feeding' | 'health' | 'grooming' | 'training'

export const GLANCE_TITLE = (name: string) => `${name} at a glance`

export const HANDBOOK_CHAPTERS: { id: HandbookChapterId; number: number; title: (name: string, breed: string) => string }[] = [
  { id: 'origin', number: 2, title: (_n, breed) => `What a ${breed} was built to do` },
  { id: 'mind', number: 3, title: (name) => `Inside ${name}'s head` },
  { id: 'life_stage', number: 4, title: (name) => `${name}'s life stage` },
  { id: 'exercise', number: 5, title: () => 'Exercise and mental work' },
  { id: 'home', number: 6, title: () => 'Home life' },
  { id: 'feeding', number: 7, title: () => 'Feeding' },
  { id: 'health', number: 8, title: () => 'Health watch' },
  { id: 'grooming', number: 9, title: () => 'Grooming and body care' },
  { id: 'training', number: 10, title: (_n, breed) => `Training a ${breed}` },
]

export type HandbookSheetId = 'daily_routine' | 'care_checklist' | 'year' | 'vet_questions' | 'sitter'

export const HANDBOOK_SHEETS: { id: HandbookSheetId; title: (name: string) => string }[] = [
  { id: 'daily_routine', title: (name) => `${name}'s daily routine` },
  { id: 'care_checklist', title: () => 'Care checklist' },
  { id: 'year', title: (name) => `${name}'s year` },
  { id: 'vet_questions', title: () => 'Questions for the vet' },
  { id: 'sitter', title: (name) => `Looking after ${name}` },
]

/** The 12 trait bars of chapter 1, in order */
export const HANDBOOK_TRAITS = [
  'Trainability', 'Energy', 'Independence', 'Sociability', 'Affection', 'Patience',
  'Prey drive', 'Guarding instinct', 'Food motivation', 'Play motivation', 'Focus outdoors', 'Beginner-friendliness',
] as const

export function isHandbook(value: unknown): value is Handbook {
  return Boolean(
    value && typeof value === 'object' &&
    (value as Handbook).version === 1 &&
    Array.isArray((value as Handbook).chapters) &&
    Array.isArray((value as Handbook).traits),
  )
}

/** "Label: value" → ["Label", "value"]; a line without a colon is all value. */
export function splitFact(item: string): [string, string] {
  const at = item.indexOf(': ')
  return at > 0 && at < 60 ? [item.slice(0, at), item.slice(at + 2)] : ['', item]
}
