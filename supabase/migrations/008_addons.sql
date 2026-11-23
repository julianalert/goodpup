-- Migration 008 — Paid add-ons
-- Run this in the Supabase SQL Editor (Database > SQL Editor).
--
-- submission_addons: one row per add-on a customer has paid for (the breed handbook
-- and the nutrition plan). A row exists only once the add-on is paid: no row = locked.
-- Each add-on has its own status and attempt count, separate from the plan's, so a
-- problem generating an add-on can never touch the plan.
--
-- Safe to deploy the code before running this: until the table exists, add-ons are
-- not offered anywhere (order page, training space), and orders work as before.

CREATE TABLE IF NOT EXISTS submission_addons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES submissions(session_id) ON DELETE CASCADE,
  addon_id    TEXT NOT NULL,                     -- e.g. 'breed_handbook' (see lib/addons.ts)
  status      TEXT NOT NULL DEFAULT 'pending',   -- 'awaiting_input' | 'pending' | 'generating' | 'ready' | 'failed'
  attempts    INTEGER NOT NULL DEFAULT 0,        -- generation attempts so far; the retry sweep stops at 10
  content     JSONB,                             -- the generated add-on, once ready
  settings    JSONB,                             -- what the customer tells us inside it (the nutrition plan's questions)
  intake_email_at TIMESTAMPTZ,                   -- when we emailed them to answer its questions, if it has any
  stripe_session_id TEXT,                        -- the checkout that paid for it (cs_...)
  amount_cents      INTEGER,                     -- list price at the time of purchase
  ready_at    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, addon_id)
);

CREATE INDEX IF NOT EXISTS submission_addons_session_idx ON submission_addons (session_id);
CREATE INDEX IF NOT EXISTS submission_addons_status_idx  ON submission_addons (status) WHERE status <> 'ready';

DROP TRIGGER IF EXISTS submission_addons_updated_at ON submission_addons;
CREATE TRIGGER submission_addons_updated_at
  BEFORE UPDATE ON submission_addons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- If an earlier version of this migration was already run, the table exists
-- without these columns: add them. Does nothing otherwise.
ALTER TABLE submission_addons
  ADD COLUMN IF NOT EXISTS settings JSONB,
  ADD COLUMN IF NOT EXISTS intake_email_at TIMESTAMPTZ;

-- Same model as submissions: only the server (service role) reads and writes.
ALTER TABLE submission_addons ENABLE ROW LEVEL SECURITY;
