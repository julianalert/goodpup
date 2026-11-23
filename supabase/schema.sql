-- ============================================================
-- PawCraft — Supabase Schema
-- Run this in your Supabase SQL Editor (Database > SQL Editor)
-- ============================================================

-- 1. SUBMISSIONS TABLE
-- ============================================================

CREATE TABLE submissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),

  -- Step 1: About your dog
  dog_name    TEXT,
  dog_breed   TEXT,
  dog_age     TEXT,   -- 'puppy_under6' | 'puppy_6to12' | 'adolescent' | 'adult' | 'senior'

  -- Step 2: Problems
  problems        TEXT[],   -- up to 3 values, e.g. ARRAY['leash_pulling', 'barking']
  problem_context TEXT,

  -- Step 3: Situation
  experience  TEXT,   -- 'first_dog' | 'some_experience' | 'experienced'
  living      TEXT,   -- 'apartment' | 'house_no_garden' | 'house_garden' | 'rural'

  -- Step 4: Time & commitment
  daily_time        INTEGER,  -- minutes per day
  training_history  TEXT,     -- 'none' | 'some_home' | 'classes' | 'trainer'

  -- Step 5: Delivery
  email TEXT,

  -- Stripe
  stripe_session_id        TEXT,   -- Stripe Checkout Session ID (cs_...)
  stripe_payment_intent_id TEXT,   -- Stripe PaymentIntent ID (pi_...) — set by webhook

  -- Plan generation
  plan_html   TEXT,                -- AI-generated HTML (body sections only, no DOCTYPE)
  plan_json   JSONB,               -- structured plan (interactive training space); new orders use this
  plan_status TEXT NOT NULL DEFAULT 'pending',
  -- plan_status: 'pending' | 'generating' | 'ready' | 'failed'
  plan_attempts INTEGER NOT NULL DEFAULT 0,  -- generation attempts so far; the retry sweep stops at 10

  -- Training space: reminders and personal touches (see migrations/006)
  plan_ready_at        TIMESTAMPTZ,
  reminders_enabled    BOOLEAN  NOT NULL DEFAULT TRUE,
  reminder_hour        SMALLINT NOT NULL DEFAULT 8,   -- 0–23, customer's own timezone
  timezone             TEXT,
  last_reminder_at     TIMESTAMPTZ,
  reminders_unanswered SMALLINT NOT NULL DEFAULT 0,
  dog_photo            TEXT,                          -- small data-URL photo

  -- Traffic source, set once when the row is created (see migrations/007)
  utm_source   TEXT,
  utm_medium   TEXT,
  utm_campaign TEXT,
  utm_content  TEXT,
  utm_term     TEXT,
  referrer     TEXT,   -- hostname of the referring site
  landing_page TEXT,   -- first page the visitor landed on

  -- Tracking
  -- current_step: 0 = quiz opened, nothing submitted yet; 1–5 = last step submitted.
  -- The API route always sets it explicitly (0 when /start loads).
  current_step  INTEGER      NOT NULL DEFAULT 1,
  status        TEXT         NOT NULL DEFAULT 'partial',
  -- status values: 'partial' | 'completed' | 'paid'

  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2. AUTO-UPDATE updated_at ON EVERY WRITE
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. INDEXES
-- ============================================================

CREATE INDEX submissions_session_id_idx    ON submissions (session_id);
CREATE INDEX submissions_email_idx         ON submissions (email)             WHERE email IS NOT NULL;
CREATE INDEX submissions_status_idx        ON submissions (status);
CREATE INDEX submissions_created_at_idx    ON submissions (created_at DESC);
CREATE INDEX submissions_stripe_session_idx ON submissions (stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX submissions_utm_source_idx     ON submissions (utm_source)        WHERE utm_source IS NOT NULL;

-- 3b. PLAN PROGRESS (what each customer has done in their training space)
-- ============================================================

CREATE TABLE plan_progress (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES submissions(session_id) ON DELETE CASCADE,
  kind        TEXT NOT NULL,   -- 'exercise' | 'day' | 'milestone' | 'rating'
  key         TEXT NOT NULL,   -- e.g. 'd3.e1', 'd3', 'w1.m2', 'leash_pulling@0'
  value       JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, kind, key)
);

CREATE INDEX plan_progress_session_idx ON plan_progress (session_id);

CREATE TRIGGER plan_progress_updated_at
  BEFORE UPDATE ON plan_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE plan_progress ENABLE ROW LEVEL SECURITY;

-- 3c. PAID ADD-ONS (one row per add-on a customer has paid for; see migrations/008)
-- ============================================================

CREATE TABLE submission_addons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES submissions(session_id) ON DELETE CASCADE,
  addon_id    TEXT NOT NULL,                     -- e.g. 'breed_handbook' (see lib/addons.ts)
  status      TEXT NOT NULL DEFAULT 'pending',   -- 'awaiting_input' | 'pending' | 'generating' | 'ready' | 'failed'
  attempts    INTEGER NOT NULL DEFAULT 0,
  content     JSONB,
  settings    JSONB,                             -- what the customer tells us inside it (the nutrition plan's questions)
  intake_email_at TIMESTAMPTZ,                   -- when we emailed them to answer its questions
  stripe_session_id TEXT,
  amount_cents      INTEGER,
  ready_at    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, addon_id)
);

CREATE INDEX submission_addons_session_idx ON submission_addons (session_id);
CREATE INDEX submission_addons_status_idx  ON submission_addons (status) WHERE status <> 'ready';

CREATE TRIGGER submission_addons_updated_at
  BEFORE UPDATE ON submission_addons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE submission_addons ENABLE ROW LEVEL SECURITY;

-- 4. ROW LEVEL SECURITY
-- ============================================================
-- The table is only written to by the Next.js API route, which uses
-- the SERVICE ROLE key server-side. That key bypasses RLS entirely.
-- We therefore grant NO permissions to the anon role — the browser
-- never talks to Supabase directly.

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- No policies created for 'anon' or 'authenticated'.
-- The service_role key (used only in the server-side API route)
-- bypasses RLS by design in Supabase.

-- 5. ADMIN VIEWS
-- ============================================================

CREATE VIEW completed_submissions AS
  SELECT * FROM submissions
  WHERE status = 'completed'
  ORDER BY created_at DESC;

-- Drop-off funnel: see how many users reach each step
CREATE VIEW step_funnel AS
  SELECT
    current_step,
    status,
    COUNT(*) AS count
  FROM submissions
  GROUP BY current_step, status
  ORDER BY current_step;
