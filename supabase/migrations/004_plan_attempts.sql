-- Migration 004 — Count plan generation attempts
-- Run this in the Supabase SQL Editor (Database > SQL Editor).
--
-- Lets a failed plan be retried automatically without retrying forever:
-- the retry sweep (/api/cron/retry-plans) stops after 10 attempts and emails us.
-- Until this has been run, plans still generate normally; only the automatic
-- retry sweep stays off (it answers with an error that names this migration).

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS plan_attempts INTEGER NOT NULL DEFAULT 0;

-- The sweep's query: paid orders whose plan is not ready yet
CREATE INDEX IF NOT EXISTS submissions_plan_retry_idx
  ON submissions (plan_status, updated_at)
  WHERE status = 'paid' AND plan_status <> 'ready';
