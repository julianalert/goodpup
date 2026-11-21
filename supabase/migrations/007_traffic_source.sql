-- Migration 007 — Traffic source of each quiz visitor (admin report)
-- Run this in the Supabase SQL Editor (Database > SQL Editor).
--
-- Safe to deploy the code before running this: until these columns exist the quiz
-- saves rows exactly as before, and the admin report shows a note instead of the
-- traffic tables. Sources are recorded from the moment this has run.
--
-- Set once, when the row is created (the quiz opens), from what the browser
-- remembers about how the visitor arrived — on any page of the site, not just /start.

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS utm_source   TEXT,   -- e.g. 'google', 'facebook', 'newsletter' (lowercased)
  ADD COLUMN IF NOT EXISTS utm_medium   TEXT,   -- e.g. 'cpc', 'social', 'email' (lowercased)
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_content  TEXT,
  ADD COLUMN IF NOT EXISTS utm_term     TEXT,
  ADD COLUMN IF NOT EXISTS referrer     TEXT,   -- hostname of the site that sent them, e.g. 'google.com'
  ADD COLUMN IF NOT EXISTS landing_page TEXT;   -- first page they landed on, e.g. '/dogs/labrador'
                                                -- (NULL = row created before tracking began)

CREATE INDEX IF NOT EXISTS submissions_utm_source_idx
  ON submissions (utm_source)
  WHERE utm_source IS NOT NULL;
