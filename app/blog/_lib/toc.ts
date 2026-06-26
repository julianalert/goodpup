export type TocItem = {
  id: string;
  level: 2 | 3;
  text: string;
};

const HEADING_REGEX = /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi;
const ID_ATTR_REGEX = /\bid="([^"]+)"/;
const HTML_TAG_REGEX = /<[^>]+>/g;
const NON_SLUG_CHARS_REGEX = /[^a-z0-9\s-]/g;
const WHITESPACE_REGEX = /\s+/g;
const ARTICLE_SECTION_REGEX = /<h([23])([^>]*)>([\s\S]*?)<\/h\1>([\s\S]*?)(?=<h[23]\b|$)/gi;
const INLINE_TOC_HEADING_REGEX = /^(table\s+of\s+contents|contents|in\s+this\s+article|on\s+this\s+page):?$/i;
const INLINE_TOC_BLOCK_OPEN_REGEX = /^\s*<(nav|ol|ul)\b[^>]*>/i;
const INLINE_TOC_LINK_PARAGRAPH_REGEX = /^\s*<p\b[^>]*>[\s\S]*?<\/p>/i;
const HASH_LINK_REGEX = /\bhref\s*=\s*(["'])#[^"']+\1/i;
const SELF_CLOSING_TAG_END_REGEX = /\/>\s*$/;
const ID_COLLISION_START = 2;

const stripHtml = (html: string): string => html.replace(HTML_TAG_REGEX, '').trim();

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(NON_SLUG_CHARS_REGEX, '')
    .trim()
    .replace(WHITESPACE_REGEX, '-');

const getLeadingElementEndIndex = (html: string, tagName: string): number | null => {
  const tagRegex = new RegExp(`</?${tagName}\\b[^>]*>`, 'gi');
  let depth = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[0];

    if (tag.startsWith('</')) {
      depth--;
      if (depth === 0) return tagRegex.lastIndex;
      continue;
    }

    if (!SELF_CLOSING_TAG_END_REGEX.test(tag)) {
      depth++;
    }
  }

  return null;
};

const removeLeadingTocMarkup = (html: string): string => {
  let output = html;
  let changed = true;

  while (changed) {
    changed = false;
    const blockOpenMatch = output.match(INLINE_TOC_BLOCK_OPEN_REGEX);

    if (blockOpenMatch) {
      const endIndex = getLeadingElementEndIndex(output, blockOpenMatch[1].toLowerCase());

      if (endIndex === null) {
        return output;
      }

      output = output.slice(endIndex);
      changed = true;
      continue;
    }

    const paragraphMatch = output.match(INLINE_TOC_LINK_PARAGRAPH_REGEX);

    if (paragraphMatch && HASH_LINK_REGEX.test(paragraphMatch[0])) {
      output = output.slice(paragraphMatch[0].length);
      changed = true;
    }
  }

  return output;
};

const removeInlineTableOfContents = (html: string): string =>
  html.replace(
    ARTICLE_SECTION_REGEX,
    (
      match,
      _level: string,
      _attrs: string,
      content: string,
      sectionBody: string,
    ) => {
      const text = stripHtml(content).replace(WHITESPACE_REGEX, ' ');

      if (!INLINE_TOC_HEADING_REGEX.test(text)) {
        return match;
      }

      return removeLeadingTocMarkup(sectionBody);
    },
  );

const claimId = (id: string, used: Set<string>): string => {
  if (!used.has(id)) {
    used.add(id);
    return id;
  }
  let counter = ID_COLLISION_START;
  while (used.has(`${id}-${counter}`)) counter++;
  const unique = `${id}-${counter}`;
  used.add(unique);
  return unique;
};

export const ensureHeadingIds = (html: string): { html: string; tocItems: TocItem[] } => {
  const tocItems: TocItem[] = [];
  const usedIds = new Set<string>();
  const htmlWithoutInlineToc = removeInlineTableOfContents(html);

  const output = htmlWithoutInlineToc.replace(HEADING_REGEX, (
    match,
    levelStr: string,
    attrs: string,
    content: string,
  ) => {
    const text = stripHtml(content);
    if (!text) return match;

    const level = Number(levelStr) as 2 | 3;
    const existingIdMatch = attrs.match(ID_ATTR_REGEX);
    let nextAttrs = attrs;
    let id: string;

    if (existingIdMatch) {
      id = claimId(existingIdMatch[1], usedIds);
      if (id !== existingIdMatch[1]) {
        nextAttrs = attrs.replace(ID_ATTR_REGEX, `id="${id}"`);
      }
    } else {
      const slug = slugify(text) || `section-${tocItems.length + 1}`;
      id = claimId(slug, usedIds);
      nextAttrs = `${attrs} id="${id}"`;
    }

    tocItems.push({ id, level, text });
    return `<h${levelStr}${nextAttrs}>${content}</h${levelStr}>`;
  });

  return { html: output, tocItems };
};
