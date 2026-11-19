-- Migration 005 — The interactive training space
-- Run this in the Supabase SQL Editor (Database > SQL Editor).
--
-- 1. plan_json: the plan as structured data (days, exercises, steps…) instead of
--    one block of HTML, so the page can show "today", tick things off and track progress.
-- 2. plan_progress: what each customer has done (exercises, day check-ins,
--    weekly milestones, behaviour ratings).
--
-- Safe to deploy the code before running this: until plan_json exists, new orders
-- keep getting the previous HTML plan. Plans already delivered are not touched.

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS plan_json JSONB;

CREATE TABLE IF NOT EXISTS plan_progress (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES submissions(session_id) ON DELETE CASCADE,
  kind        TEXT NOT NULL,   -- 'exercise' | 'day' | 'milestone' | 'rating'
  key         TEXT NOT NULL,   -- e.g. 'd3.e1', 'd3', 'w1.m2', 'leash_pulling@0'
  value       JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, kind, key)
);

CREATE INDEX IF NOT EXISTS plan_progress_session_idx ON plan_progress (session_id);

DROP TRIGGER IF EXISTS plan_progress_updated_at ON plan_progress;
CREATE TRIGGER plan_progress_updated_at
  BEFORE UPDATE ON plan_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Same model as submissions: only the server (service role) reads and writes.
ALTER TABLE plan_progress ENABLE ROW LEVEL SECURITY;
