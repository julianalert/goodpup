/**
 * Override the publish date displayed for specific blog posts.
 * Add an entry with the post's slug and an ISO 8601 date string.
 *
 * Example:
 *   'my-post-slug': '2026-01-15',
 *
 * Dates here take precedence over the created_at date from Outrank.
 * Remove an entry to revert to the Outrank date.
 */
const publishDateOverrides: Record<string, string> = {
  'dog-training-for-first-time-owners':                  '2026-07-03',
  'dog-breeds-for-kids':                                 '2026-07-02',
  'first-time-dog-owner-tips':                           '2026-07-01',
  'dog-training-for-adult-dogs':                         '2026-06-30',
  'how-to-stop-aggressive-behavior-towards-other-dogs':  '2026-06-29',
  'best-dog-breed-for-beginners':                        '2026-06-28',
  'dog-behavior-modification-plan':                      '2026-06-27',
  'dog-training-collar-metal':                           '2026-06-26',
};

export default publishDateOverrides;
